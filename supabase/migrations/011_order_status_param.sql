-- ============================================================
-- Migration 011: Optional status param on create_order_transaction
--
-- Needed for the POS / Quick Sale screen: a walk-in sale is created
-- and fulfilled in the same action, so it should be inserted as
-- 'delivered' instead of the hardcoded 'pending'. The regular Order
-- creation form is unaffected — it doesn't pass this param, so it
-- keeps defaulting to 'pending'.
-- ============================================================

DROP FUNCTION IF EXISTS create_order_transaction(uuid, jsonb, numeric, numeric, numeric, text, text, text, uuid);

CREATE OR REPLACE FUNCTION create_order_transaction(
  p_customer_id    uuid,
  p_items          jsonb,
  p_discount_amount numeric,
  p_tax_amount      numeric,
  p_shipping_amount numeric,
  p_payment_method  text,
  p_payment_status  text,
  p_notes           text,
  p_user_id         uuid,
  p_status          text DEFAULT 'pending'
) RETURNS uuid AS $$
DECLARE
  v_order_id    uuid;
  v_order_number text;
  v_subtotal    numeric := 0;
  v_grand_total numeric;
  v_item        jsonb;
  v_product_qty integer;
  v_item_qty    integer;
  v_item_price  numeric;
  v_item_disc   numeric;
  v_item_total  numeric;
BEGIN
  -- Generate order number using sequence
  v_order_number := 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
    LPAD(nextval('order_number_seq')::text, 4, '0');

  -- Calculate subtotal from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty   := (v_item->>'quantity')::integer;
    v_item_price := (v_item->>'unit_price')::numeric;
    v_item_disc  := COALESCE((v_item->>'discount_percent')::numeric, 0);
    v_item_total := v_item_price * v_item_qty * (1 - v_item_disc / 100);
    v_subtotal   := v_subtotal + v_item_total;
  END LOOP;

  v_grand_total := v_subtotal - p_discount_amount + p_tax_amount + p_shipping_amount;

  -- Insert order (bypassing DEFAULT for order_number)
  INSERT INTO orders (
    order_number, customer_id, status, payment_method, payment_status,
    subtotal, discount_amount, tax_amount, shipping_amount, grand_total, notes
  ) VALUES (
    v_order_number, p_customer_id, p_status, p_payment_method, p_payment_status,
    v_subtotal, p_discount_amount, p_tax_amount, p_shipping_amount, v_grand_total, p_notes
  ) RETURNING id INTO v_order_id;

  -- Insert items + adjust stock + record inventory history
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty   := (v_item->>'quantity')::integer;
    v_item_price := (v_item->>'unit_price')::numeric;
    v_item_disc  := COALESCE((v_item->>'discount_percent')::numeric, 0);
    v_item_total := v_item_price * v_item_qty * (1 - v_item_disc / 100);

    SELECT quantity INTO v_product_qty
    FROM products WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_product_qty IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF v_product_qty < v_item_qty THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_product_qty, v_item_qty;
    END IF;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_percent, total_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item_qty,
      v_item_price,
      v_item_disc,
      v_item_total
    );

    UPDATE products
    SET quantity = quantity - v_item_qty, updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid;

    INSERT INTO inventory_history (product_id, user_id, action, previous_quantity, updated_quantity, quantity_change, notes)
    VALUES (
      (v_item->>'product_id')::uuid,
      p_user_id,
      'stock_out',
      v_product_qty,
      v_product_qty - v_item_qty,
      -v_item_qty,
      'Order: ' || v_order_number
    );
  END LOOP;

  -- Create payment record if paid
  IF p_payment_status = 'paid' THEN
    INSERT INTO payments (order_id, amount, payment_method, payment_date)
    VALUES (v_order_id, v_grand_total, p_payment_method, now());
  END IF;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
