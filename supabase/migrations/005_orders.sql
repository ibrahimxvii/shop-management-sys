-- ============================================================
-- Migration 005: Orders, Customers, Payments
-- ============================================================

-- ============================================================
-- Customers table
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    text         NOT NULL,
  email        text         UNIQUE,
  phone        text,
  address      text,
  city         text,
  state        text,
  country      text         NOT NULL DEFAULT 'US',
  postal_code  text,
  notes        text,
  created_at   timestamptz  DEFAULT now() NOT NULL,
  updated_at   timestamptz  DEFAULT now() NOT NULL
);

-- ============================================================
-- Orders table
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE IF NOT EXISTS orders (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number     text          UNIQUE NOT NULL DEFAULT ('ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::text, 4, '0')),
  customer_id      uuid          REFERENCES customers(id) ON DELETE SET NULL,
  status           text          NOT NULL DEFAULT 'pending',
  payment_method   text          NOT NULL DEFAULT 'cash',
  payment_status   text          NOT NULL DEFAULT 'unpaid',
  subtotal         numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount  numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount       numeric(12,2) NOT NULL DEFAULT 0,
  shipping_amount  numeric(12,2) NOT NULL DEFAULT 0,
  grand_total      numeric(12,2) NOT NULL DEFAULT 0,
  notes            text,
  created_at       timestamptz   DEFAULT now() NOT NULL,
  updated_at       timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT orders_status_check
    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('cash','card','bank_transfer','online')),
  CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('unpaid','partial','paid','refunded'))
);

-- ============================================================
-- Order Items table
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity         integer       NOT NULL DEFAULT 1,
  unit_price       numeric(12,2) NOT NULL,
  discount_percent numeric(5,2)  NOT NULL DEFAULT 0,
  total_price      numeric(12,2) NOT NULL,
  created_at       timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_discount_check CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- ============================================================
-- Payments table
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount          numeric(12,2) NOT NULL,
  payment_method  text          NOT NULL,
  payment_date    timestamptz   DEFAULT now() NOT NULL,
  transaction_id  text,
  notes           text,
  created_at      timestamptz   DEFAULT now() NOT NULL
);

-- ============================================================
-- updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_id    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id     ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email       ON customers(email);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments  ENABLE ROW LEVEL SECURITY;

-- customers
CREATE POLICY "customers_read_authenticated"
  ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_write_admin_manager"
  ON customers FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "customers_update_admin_manager"
  ON customers FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "customers_delete_admin"
  ON customers FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- orders
CREATE POLICY "orders_read_authenticated"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "orders_write_admin_manager"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "orders_update_admin_manager"
  ON orders FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "orders_delete_admin"
  ON orders FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- order_items
CREATE POLICY "order_items_read_authenticated"
  ON order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_items_write_admin_manager"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "order_items_update_admin_manager"
  ON order_items FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "order_items_delete_admin_manager"
  ON order_items FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- payments
CREATE POLICY "payments_read_authenticated"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "payments_write_admin_manager"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "payments_delete_admin"
  ON payments FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- RPC: create_order_transaction
-- Atomically creates order + items + adjusts stock + records history + payment
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_transaction(
  p_customer_id    uuid,
  p_items          jsonb,
  p_discount_amount numeric,
  p_tax_amount      numeric,
  p_shipping_amount numeric,
  p_payment_method  text,
  p_payment_status  text,
  p_notes           text,
  p_user_id         uuid
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
    v_order_number, p_customer_id, 'pending', p_payment_method, p_payment_status,
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

-- ============================================================
-- RPC: cancel_order_transaction
-- Atomically cancels/refunds order and restores stock
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_order_transaction(
  p_order_id   uuid,
  p_new_status text,
  p_user_id    uuid
) RETURNS void AS $$
DECLARE
  v_item       record;
  v_order      record;
  v_prev_qty   integer;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Order is already %', v_order.status;
  END IF;

  -- Restore stock for each item
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    SELECT quantity INTO v_prev_qty FROM products WHERE id = v_item.product_id;

    UPDATE products
    SET quantity = quantity + v_item.quantity, updated_at = now()
    WHERE id = v_item.product_id;

    INSERT INTO inventory_history (product_id, user_id, action, previous_quantity, updated_quantity, quantity_change, notes)
    VALUES (
      v_item.product_id,
      p_user_id,
      'stock_in',
      v_prev_qty,
      v_prev_qty + v_item.quantity,
      v_item.quantity,
      'Order ' || p_new_status || ': ' || v_order.order_number
    );
  END LOOP;

  UPDATE orders SET status = p_new_status, updated_at = now() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: update_order_transaction
-- Atomically updates order: restores old stock, applies new items, recalculates totals
-- ============================================================

CREATE OR REPLACE FUNCTION update_order_transaction(
  p_order_id        uuid,
  p_customer_id     uuid,
  p_items           jsonb,
  p_discount_amount numeric,
  p_tax_amount      numeric,
  p_shipping_amount numeric,
  p_payment_method  text,
  p_payment_status  text,
  p_status          text,
  p_notes           text,
  p_user_id         uuid
) RETURNS void AS $$
DECLARE
  v_old_item   record;
  v_item       jsonb;
  v_order      record;
  v_prev_qty   integer;
  v_product_qty integer;
  v_item_qty   integer;
  v_item_price numeric;
  v_item_disc  numeric;
  v_item_total numeric;
  v_subtotal   numeric := 0;
  v_grand_total numeric;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Restore stock from old items
  FOR v_old_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    SELECT quantity INTO v_prev_qty FROM products WHERE id = v_old_item.product_id;

    UPDATE products
    SET quantity = quantity + v_old_item.quantity, updated_at = now()
    WHERE id = v_old_item.product_id;

    INSERT INTO inventory_history (product_id, user_id, action, previous_quantity, updated_quantity, quantity_change, notes)
    VALUES (
      v_old_item.product_id,
      p_user_id,
      'stock_in',
      v_prev_qty,
      v_prev_qty + v_old_item.quantity,
      v_old_item.quantity,
      'Order edit restore: ' || v_order.order_number
    );
  END LOOP;

  -- Delete old items
  DELETE FROM order_items WHERE order_id = p_order_id;

  -- Insert new items + deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty   := (v_item->>'quantity')::integer;
    v_item_price := (v_item->>'unit_price')::numeric;
    v_item_disc  := COALESCE((v_item->>'discount_percent')::numeric, 0);
    v_item_total := v_item_price * v_item_qty * (1 - v_item_disc / 100);

    SELECT quantity INTO v_product_qty
    FROM products WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_product_qty < v_item_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_percent, total_price)
    VALUES (
      p_order_id,
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
      'Order edit: ' || v_order.order_number
    );

    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  v_grand_total := v_subtotal - p_discount_amount + p_tax_amount + p_shipping_amount;

  UPDATE orders SET
    customer_id     = p_customer_id,
    status          = p_status,
    payment_method  = p_payment_method,
    payment_status  = p_payment_status,
    subtotal        = v_subtotal,
    discount_amount = p_discount_amount,
    tax_amount      = p_tax_amount,
    shipping_amount = p_shipping_amount,
    grand_total     = v_grand_total,
    notes           = p_notes,
    updated_at      = now()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: get_order_stats
-- Returns dashboard statistics for orders
-- ============================================================

CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS json AS $$
DECLARE
  v_total      integer;
  v_pending    integer;
  v_completed  integer;
  v_revenue    numeric;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COALESCE(SUM(grand_total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0)
  INTO v_total, v_pending, v_completed, v_revenue
  FROM orders;

  RETURN json_build_object(
    'total_orders',     v_total,
    'pending_orders',   v_pending,
    'completed_orders', v_completed,
    'total_revenue',    v_revenue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
