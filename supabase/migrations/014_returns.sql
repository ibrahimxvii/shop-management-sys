-- ============================================================
-- Migration 014: Returns & Refunds
--
-- Adds a proper partial/full return workflow for orders, distinct from
-- the existing all-or-nothing cancel flow (cancel_order_transaction):
-- a return restocks specific items/quantities, records a refund, and
-- updates payment_status to 'partial' or (when everything on the order
-- has been returned) sets order status/payment_status to 'refunded'.
-- ============================================================

CREATE TABLE IF NOT EXISTS order_returns (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id        uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  reason         text,
  refund_amount  numeric(12,2) NOT NULL DEFAULT 0,
  refund_method  text          NOT NULL,
  created_at     timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT order_returns_refund_method_check
    CHECK (refund_method IN ('cash','card','bank_transfer','online'))
);

CREATE TABLE IF NOT EXISTS order_return_items (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id      uuid          NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_item_id  uuid          NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_id     uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       integer       NOT NULL,
  unit_refund    numeric(12,2) NOT NULL,
  created_at     timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT order_return_items_quantity_check CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_return_items_return_id ON order_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_order_return_items_order_item_id ON order_return_items(order_item_id);

ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_returns_read_authenticated"
  ON order_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_returns_write_admin_manager"
  ON order_returns FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "order_return_items_read_authenticated"
  ON order_return_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_return_items_write_admin_manager"
  ON order_return_items FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- ============================================================
-- RPC: process_return_transaction
-- Atomically restocks returned items, records the return + refund
-- payment, and updates order/payment status.
--
-- p_items shape: [{ "order_item_id": uuid, "quantity": int }, ...]
-- ============================================================

CREATE OR REPLACE FUNCTION process_return_transaction(
  p_order_id      uuid,
  p_items         jsonb,
  p_reason        text,
  p_refund_method text,
  p_user_id       uuid
) RETURNS uuid AS $$
DECLARE
  v_return_id       uuid;
  v_order           record;
  v_item            jsonb;
  v_order_item      record;
  v_qty             integer;
  v_already_returned integer;
  v_remaining       integer;
  v_proration_ratio numeric;
  v_line_share      numeric;
  v_item_refund     numeric;
  v_unit_refund     numeric;
  v_refund_total    numeric := 0;
  v_prev_qty        integer;
  v_total_ordered   integer;
  v_total_returned  integer;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Order is already %', v_order.status;
  END IF;

  -- Ratio of what the customer actually paid (grand_total) vs. the raw
  -- item subtotal, so refunds proportionally include/exclude discount,
  -- tax, and shipping rather than refunding the pre-adjustment line price.
  v_proration_ratio := COALESCE(v_order.grand_total / NULLIF(v_order.subtotal, 0), 1);

  INSERT INTO order_returns (order_id, user_id, reason, refund_amount, refund_method)
  VALUES (p_order_id, p_user_id, p_reason, 0, p_refund_method)
  RETURNING id INTO v_return_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;

    SELECT * INTO v_order_item
    FROM order_items
    WHERE id = (v_item->>'order_item_id')::uuid AND order_id = p_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order item not found: %', v_item->>'order_item_id';
    END IF;

    SELECT COALESCE(SUM(ori.quantity), 0) INTO v_already_returned
    FROM order_return_items ori
    WHERE ori.order_item_id = v_order_item.id;

    v_remaining := v_order_item.quantity - v_already_returned;
    IF v_qty > v_remaining THEN
      RAISE EXCEPTION 'Cannot return % units — only % remaining for this item', v_qty, v_remaining;
    END IF;

    -- Prorate this line's total_price by the order-level ratio, then take
    -- the returned share of it — computed once from full precision so we
    -- don't compound rounding by multiplying an already-rounded unit price.
    v_line_share  := v_order_item.total_price * v_proration_ratio;
    v_item_refund := round(v_line_share * v_qty / v_order_item.quantity, 2);
    v_unit_refund := round(v_item_refund / v_qty, 2);

    INSERT INTO order_return_items (return_id, order_item_id, product_id, quantity, unit_refund)
    VALUES (v_return_id, v_order_item.id, v_order_item.product_id, v_qty, v_unit_refund);

    v_refund_total := v_refund_total + v_item_refund;

    SELECT quantity INTO v_prev_qty FROM products WHERE id = v_order_item.product_id FOR UPDATE;

    UPDATE products
    SET quantity = quantity + v_qty, updated_at = now()
    WHERE id = v_order_item.product_id;

    INSERT INTO inventory_history (product_id, user_id, action, previous_quantity, updated_quantity, quantity_change, notes)
    VALUES (
      v_order_item.product_id,
      p_user_id,
      'stock_in',
      v_prev_qty,
      v_prev_qty + v_qty,
      v_qty,
      'Return: ' || v_order.order_number
    );
  END LOOP;

  UPDATE order_returns SET refund_amount = v_refund_total WHERE id = v_return_id;

  INSERT INTO payments (order_id, amount, payment_method, payment_date, notes)
  VALUES (p_order_id, -v_refund_total, p_refund_method, now(), 'Refund: return ' || v_return_id);

  -- Determine whether the whole order has now been returned
  SELECT COALESCE(SUM(oi.quantity), 0) INTO v_total_ordered
  FROM order_items oi WHERE oi.order_id = p_order_id;

  SELECT COALESCE(SUM(ori.quantity), 0) INTO v_total_returned
  FROM order_return_items ori
  JOIN order_items oi ON oi.id = ori.order_item_id
  WHERE oi.order_id = p_order_id;

  IF v_total_returned >= v_total_ordered THEN
    UPDATE orders SET status = 'refunded', payment_status = 'refunded', updated_at = now()
    WHERE id = p_order_id;
  ELSE
    UPDATE orders SET payment_status = 'partial', updated_at = now()
    WHERE id = p_order_id;
  END IF;

  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
