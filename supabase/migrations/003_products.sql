-- ============================================================
-- Migration 003: Products, Categories, Brands, Product Images
-- ============================================================

-- Storage bucket for product images (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text         NOT NULL,
  slug        text         NOT NULL,
  description text,
  parent_id   uuid         REFERENCES categories(id) ON DELETE SET NULL,
  created_at  timestamptz  DEFAULT now() NOT NULL,
  updated_at  timestamptz  DEFAULT now() NOT NULL,
  CONSTRAINT categories_name_unique  UNIQUE (name),
  CONSTRAINT categories_slug_unique  UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS brands (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text         NOT NULL,
  slug        text         NOT NULL,
  description text,
  logo_url    text,
  created_at  timestamptz  DEFAULT now() NOT NULL,
  updated_at  timestamptz  DEFAULT now() NOT NULL,
  CONSTRAINT brands_name_unique UNIQUE (name),
  CONSTRAINT brands_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS products (
  id               uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text         NOT NULL,
  description      text,
  sku              text,
  barcode          text,
  category_id      uuid         REFERENCES categories(id) ON DELETE SET NULL,
  brand_id         uuid         REFERENCES brands(id)     ON DELETE SET NULL,
  purchase_price   numeric(12,2) NOT NULL DEFAULT 0,
  selling_price    numeric(12,2) NOT NULL DEFAULT 0,
  quantity         integer       NOT NULL DEFAULT 0,
  low_stock_limit  integer       NOT NULL DEFAULT 10,
  status           text          NOT NULL DEFAULT 'active',
  is_featured      boolean       NOT NULL DEFAULT false,
  tags             text[]        NOT NULL DEFAULT '{}',
  created_at       timestamptz   DEFAULT now() NOT NULL,
  updated_at       timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT products_sku_unique          UNIQUE (sku),
  CONSTRAINT products_status_check        CHECK (status IN ('active', 'inactive', 'draft')),
  CONSTRAINT products_purchase_price_pos  CHECK (purchase_price >= 0),
  CONSTRAINT products_selling_price_pos   CHECK (selling_price >= 0),
  CONSTRAINT products_quantity_pos        CHECK (quantity >= 0),
  CONSTRAINT products_low_stock_limit_pos CHECK (low_stock_limit >= 0)
);

CREATE TABLE IF NOT EXISTS product_images (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text         NOT NULL,
  path        text         NOT NULL,
  is_primary  boolean      NOT NULL DEFAULT false,
  sort_order  integer      NOT NULL DEFAULT 0,
  created_at  timestamptz  DEFAULT now() NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id     ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status       ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured  ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_quantity     ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_created_at   ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm    ON products USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary  ON product_images(product_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug     ON brands(slug);

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Helper: check role without recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = (SELECT auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Categories
CREATE POLICY "categories_read_authenticated"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_write_admin_manager"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "categories_update_admin_manager"
  ON categories FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- Brands
CREATE POLICY "brands_read_authenticated"
  ON brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "brands_write_admin_manager"
  ON brands FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "brands_update_admin_manager"
  ON brands FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "brands_delete_admin"
  ON brands FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- Products
CREATE POLICY "products_read_authenticated"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_write_admin_manager"
  ON products FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "products_update_admin_manager"
  ON products FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "products_delete_admin_manager"
  ON products FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- Product Images
CREATE POLICY "product_images_read_authenticated"
  ON product_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_images_write_admin_manager"
  ON product_images FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "product_images_update_admin_manager"
  ON product_images FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "product_images_delete_admin_manager"
  ON product_images FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO categories (name, slug, description) VALUES
  ('Electronics',          'electronics',          'Electronic devices and accessories'),
  ('Clothing & Apparel',   'clothing-apparel',     'Clothing, shoes, and fashion accessories'),
  ('Food & Beverages',     'food-beverages',       'Food, drinks, and grocery products'),
  ('Home & Garden',        'home-garden',          'Home decor, furniture, and garden supplies'),
  ('Sports & Outdoors',    'sports-outdoors',      'Sports equipment and outdoor gear'),
  ('Beauty & Personal Care','beauty-personal-care','Cosmetics and personal care products'),
  ('Books & Media',        'books-media',          'Books, music, movies, and digital media'),
  ('Toys & Games',         'toys-games',           'Toys, games, and hobby products'),
  ('Automotive',           'automotive',           'Car parts and accessories'),
  ('Health & Wellness',    'health-wellness',      'Health supplements and medical supplies')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands (name, slug, description) VALUES
  ('Generic',      'generic',      'Generic / unbranded products'),
  ('House Brand',  'house-brand',  'Our own house brand products'),
  ('Import',       'import',       'Imported products')
ON CONFLICT (slug) DO NOTHING;
