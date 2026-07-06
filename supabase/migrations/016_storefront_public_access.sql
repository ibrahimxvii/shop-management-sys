-- ============================================================
-- Migration 016: Storefront public access
-- Public (anon) read access to the active catalog, plus a
-- dedicated guest-checkout RPC and a narrow order-tracking RPC.
-- Existing `authenticated` policies are untouched (additive only).
-- ============================================================

-- ─────────────────────────────────────────────
-- Anon read access — active catalog only
-- ─────────────────────────────────────────────

CREATE POLICY "products_read_anon_active"
  ON products FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "categories_read_anon"
  ON categories FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "brands_read_anon"
  ON brands FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "product_images_read_anon"
  ON product_images FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id AND p.status = 'active'
    )
  );

-- Shop display info (name/logo/contact) only — settings has no sensitive
-- fields, and the storefront header/footer needs to render real branding.
CREATE POLICY "settings_read_anon"
  ON settings FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- Idempotency key for guest checkout (prevents double-submit /
-- network-retry from creating duplicate orders)
-- ─────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_reference_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_reference_id
  ON orders(client_reference_id) WHERE client_reference_id IS NOT NULL;

-- inventory_history.user_id must be nullable to record stock movements
-- caused by a guest (unauthenticated) storefront order.
ALTER TABLE inventory_history ALTER COLUMN user_id DROP NOT NULL;

-- ─────────────────────────────────────────────
-- RPC: create_storefront_order_transaction
-- Guest checkout. Deliberately does NOT reuse create_order_transaction's
-- trust assumptions — every status/payment field is forced server-side,
-- stock is validated + locked the same way, and a phone-based rate limit
-- plus client-reference idempotency check guard against abuse/duplicates.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_storefront_order_transaction(
  p_client_reference_id uuid,
  p_full_name           text,
  p_phone               text,
  p_email               text,
  p_address             text,
  p_city                text,
  p_notes               text,
  p_items               jsonb
) RETURNS TABLE(order_id uuid, order_number text) AS $$
DECLARE
  v_existing_id     uuid;
  v_existing_number text;
  v_customer_id     uuid;
  v_order_id        uuid;
  v_order_number    text;
  v_subtotal        numeric := 0;
  v_item            jsonb;
  v_product         record;
  v_item_qty        integer;
  v_item_total      numeric;
  v_recent_count    integer;
BEGIN
  -- Idempotency: replay of an already-processed checkout returns the same order
  IF p_client_reference_id IS NOT NULL THEN
    SELECT id, order_number INTO v_existing_id, v_existing_number
    FROM orders WHERE client_reference_id = p_client_reference_id;
    IF FOUND THEN
      RETURN QUERY SELECT v_existing_id, v_existing_number;
      RETURN;
    END IF;
  END IF;

  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'A valid name is required';
  END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 7 THEN
    RAISE EXCEPTION 'A valid phone number is required';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Rate limit: max 5 orders per phone number per trailing 60 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE c.phone = trim(p_phone) AND o.created_at >= now() - INTERVAL '60 minutes';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders placed recently. Please try again later.';
  END IF;

  SELECT id INTO v_customer_id FROM customers WHERE phone = trim(p_phone) LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (full_name, phone, email, address, city)
    VALUES (trim(p_full_name), trim(p_phone), NULLIF(trim(p_email), ''), p_address, p_city)
    RETURNING id INTO v_customer_id;
  END IF;

  v_order_number := 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
    LPAD(nextval('order_number_seq')::text, 4, '0');

  -- Validate every item + lock rows + compute subtotal (mirrors
  -- create_order_transaction's two-pass validate-then-insert shape)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty := (v_item->>'quantity')::integer;
    IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for an item';
    END IF;

    SELECT selling_price, quantity INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::uuid AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in your cart is no longer available';
    END IF;
    IF v_product.quantity < v_item_qty THEN
      RAISE EXCEPTION 'Insufficient stock for one or more items in your cart';
    END IF;

    v_subtotal := v_subtotal + (v_product.selling_price * v_item_qty);
  END LOOP;

  INSERT INTO orders (
    order_number, customer_id, status, payment_method, payment_status,
    subtotal, discount_amount, tax_amount, shipping_amount, grand_total, notes,
    client_reference_id
  ) VALUES (
    v_order_number, v_customer_id, 'pending', 'cash', 'unpaid',
    v_subtotal, 0, 0, 0, v_subtotal, p_notes,
    p_client_reference_id
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty := (v_item->>'quantity')::integer;

    SELECT selling_price, quantity INTO v_product
    FROM products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;

    v_item_total := v_product.selling_price * v_item_qty;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_percent, total_price)
    VALUES (v_order_id, (v_item->>'product_id')::uuid, v_item_qty, v_product.selling_price, 0, v_item_total);

    UPDATE products
    SET quantity = quantity - v_item_qty, updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid;

    INSERT INTO inventory_history (product_id, user_id, action, previous_quantity, updated_quantity, quantity_change, notes)
    VALUES (
      (v_item->>'product_id')::uuid,
      NULL,
      'stock_out',
      v_product.quantity,
      v_product.quantity - v_item_qty,
      -v_item_qty,
      'Storefront order: ' || v_order_number
    );
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_storefront_order_transaction(uuid,text,text,text,text,text,text,jsonb) IS
  'Guest storefront checkout. Forces status=pending/payment_status=unpaid/payment_method=cash server-side regardless of caller input. Rate-limited to 5 orders per phone number per 60 minutes. p_client_reference_id provides idempotency: replaying the same key returns the original order instead of creating a duplicate.';

GRANT EXECUTE ON FUNCTION create_storefront_order_transaction(uuid,text,text,text,text,text,text,jsonb) TO anon;

-- ─────────────────────────────────────────────
-- RPC: get_storefront_order_status
-- Narrow, anti-enumeration order lookup: returns data only on an exact
-- order_number + phone match. A mismatch yields zero rows either way,
-- so the caller can never learn whether the order number or the phone
-- was the wrong part of the pair.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_storefront_order_status(
  p_order_number text,
  p_phone        text
) RETURNS TABLE(
  order_number   text,
  status         text,
  payment_status text,
  grand_total    numeric,
  created_at     timestamptz,
  items          jsonb
) AS $$
  SELECT
    o.order_number,
    o.status,
    o.payment_status,
    o.grand_total,
    o.created_at,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', p.name,
        'quantity',     oi.quantity,
        'unit_price',   oi.unit_price,
        'total_price',  oi.total_price
      ))
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = o.id
    ) AS items
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE o.order_number = p_order_number AND c.phone = trim(p_phone);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_storefront_order_status(text, text) IS
  'Anti-enumeration order lookup for guest order tracking — returns zero rows on any order_number/phone mismatch, never distinguishing which part was wrong.';

GRANT EXECUTE ON FUNCTION get_storefront_order_status(text, text) TO anon;
