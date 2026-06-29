-- ============================================================
-- Migration 004: Inventory, Categories & Brands enhancements
-- ============================================================

-- ============================================================
-- Storage buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  3145728, -- 3 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  3145728, -- 3 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: category-images
CREATE POLICY "category_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "category_images_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "category_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'category-images');

CREATE POLICY "category_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'category-images');

-- Storage policies: brand-logos
CREATE POLICY "brand_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-logos');

CREATE POLICY "brand_logos_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-logos');

CREATE POLICY "brand_logos_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-logos');

CREATE POLICY "brand_logos_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-logos');

-- ============================================================
-- Alter existing tables
-- ============================================================

-- Add image_url and status to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url  text,
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'active';

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_status_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_status_check
  CHECK (status IN ('active', 'inactive'));

-- Add status to brands
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS logo_path  text;

ALTER TABLE brands
  DROP CONSTRAINT IF EXISTS brands_status_check;

ALTER TABLE brands
  ADD CONSTRAINT brands_status_check
  CHECK (status IN ('active', 'inactive'));

-- ============================================================
-- Inventory History table
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_history (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id        uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           uuid          NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action            text          NOT NULL,
  previous_quantity integer       NOT NULL DEFAULT 0,
  updated_quantity  integer       NOT NULL DEFAULT 0,
  quantity_change   integer       NOT NULL DEFAULT 0,
  notes             text,
  created_at        timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT inventory_history_action_check
    CHECK (action IN ('stock_in', 'stock_out', 'adjustment', 'initial'))
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_brands_status     ON brands(status);

CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id  ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_user_id     ON inventory_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_action      ON inventory_history(action);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at  ON inventory_history(created_at DESC);

-- ============================================================
-- Row Level Security — inventory_history
-- ============================================================

ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_history_read_authenticated"
  ON inventory_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_history_write_admin_manager"
  ON inventory_history FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "inventory_history_delete_admin"
  ON inventory_history FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- Function: get_inventory_stats
-- Returns counts for dashboard integration
-- ============================================================

CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS json AS $$
DECLARE
  v_low_stock     integer;
  v_out_of_stock  integer;
  v_total_value   numeric;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE quantity > 0 AND quantity <= low_stock_limit AND status = 'active'),
    COUNT(*) FILTER (WHERE quantity = 0 AND status = 'active'),
    COALESCE(SUM(selling_price * quantity), 0)
  INTO v_low_stock, v_out_of_stock, v_total_value
  FROM products;

  RETURN json_build_object(
    'low_stock_count',    v_low_stock,
    'out_of_stock_count', v_out_of_stock,
    'total_inventory_value', v_total_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
