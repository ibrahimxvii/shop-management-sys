-- ============================================================
-- Migration 015: Suppliers & Purchase Orders
--
-- Adds supplier management and a purchase-order workflow for
-- restocking: create a PO against a supplier with line items, then
-- "receive" it to atomically add stock and record inventory history.
-- ============================================================

-- ============================================================
-- Suppliers table
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text         NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  address       text,
  city          text,
  country       text         NOT NULL DEFAULT 'PK',
  notes         text,
  status        text         NOT NULL DEFAULT 'active',
  created_at    timestamptz  DEFAULT now() NOT NULL,
  updated_at    timestamptz  DEFAULT now() NOT NULL,
  CONSTRAINT suppliers_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_read_admin_manager"
  ON suppliers FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "suppliers_write_admin_manager"
  ON suppliers FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "suppliers_update_admin_manager"
  ON suppliers FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "suppliers_delete_admin"
  ON suppliers FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- Purchase Orders
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number      text          UNIQUE NOT NULL DEFAULT ('PO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('po_number_seq')::text, 4, '0')),
  supplier_id    uuid          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status         text          NOT NULL DEFAULT 'pending',
  total_amount   numeric(12,2) NOT NULL DEFAULT 0,
  notes          text,
  created_by     uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  received_at    timestamptz,
  created_at     timestamptz   DEFAULT now() NOT NULL,
  updated_at     timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT purchase_orders_status_check CHECK (status IN ('pending', 'received', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                 uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id  uuid          NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id         uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity           integer       NOT NULL,
  unit_cost          numeric(12,2) NOT NULL,
  total_cost         numeric(12,2) NOT NULL,
  created_at         timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT purchase_order_items_quantity_check CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON purchase_order_items(product_id);

CREATE TRIGGER set_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_read_admin_manager"
  ON purchase_orders FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "purchase_orders_write_admin_manager"
  ON purchase_orders FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "purchase_orders_update_admin_manager"
  ON purchase_orders FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "purchase_orders_delete_admin"
  ON purchase_orders FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "po_items_read_admin_manager"
  ON purchase_order_items FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "po_items_write_admin_manager"
  ON purchase_order_items FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "po_items_delete_admin_manager"
  ON purchase_order_items FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- ============================================================
-- RPC: receive_purchase_order_transaction
-- Atomically adds stock for every line item, records inventory
-- history, and marks the PO as received.
-- ============================================================

CREATE OR REPLACE FUNCTION receive_purchase_order_transaction(
  p_po_id   uuid,
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  v_po      record;
  v_item    record;
  v_prev_qty integer;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.status != 'pending' THEN
    RAISE EXCEPTION 'Purchase order is already %', v_po.status;
  END IF;

  FOR v_item IN
    SELECT * FROM purchase_order_items
    WHERE purchase_order_id = p_po_id
    ORDER BY product_id
  LOOP
    SELECT quantity INTO v_prev_qty FROM products WHERE id = v_item.product_id FOR UPDATE;

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
      'PO received: ' || v_po.po_number
    );
  END LOOP;

  UPDATE purchase_orders
  SET status = 'received', received_at = now(), updated_at = now()
  WHERE id = p_po_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: create_purchase_order_transaction
-- Atomically creates the PO header + line items so a mid-way failure
-- can't leave an orphaned PO row with no items. total_amount is
-- computed server-side from the committed items, not trusted from
-- the client payload.
--
-- p_items shape: [{ "product_id": uuid, "quantity": int, "unit_cost": numeric }, ...]
-- ============================================================

CREATE OR REPLACE FUNCTION create_purchase_order_transaction(
  p_supplier_id uuid,
  p_items       jsonb,
  p_notes       text,
  p_user_id     uuid
) RETURNS uuid AS $$
DECLARE
  v_po_id       uuid;
  v_item        jsonb;
  v_total       numeric := 0;
  v_item_qty    integer;
  v_item_cost   numeric;
  v_item_total  numeric;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty  := (v_item->>'quantity')::integer;
    v_item_cost := (v_item->>'unit_cost')::numeric;
    v_total := v_total + (v_item_qty * v_item_cost);
  END LOOP;

  INSERT INTO purchase_orders (supplier_id, notes, total_amount, created_by)
  VALUES (p_supplier_id, p_notes, v_total, p_user_id)
  RETURNING id INTO v_po_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty   := (v_item->>'quantity')::integer;
    v_item_cost  := (v_item->>'unit_cost')::numeric;
    v_item_total := v_item_qty * v_item_cost;

    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost)
    VALUES (v_po_id, (v_item->>'product_id')::uuid, v_item_qty, v_item_cost, v_item_total);
  END LOOP;

  RETURN v_po_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
