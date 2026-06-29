-- ============================================================
-- 008: Settings, User Preferences, Activity Logs, Login History
-- ============================================================

-- ─────────────────────────────────────────────
-- SETTINGS TABLE (singleton shop configuration)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name               text NOT NULL DEFAULT 'ShopFlow',
  shop_email              text,
  shop_phone              text,
  shop_address            text,
  shop_city               text,
  shop_country            text NOT NULL DEFAULT 'US',
  shop_logo_url           text,
  shop_logo_path          text,
  currency                text NOT NULL DEFAULT 'USD',
  currency_symbol         text NOT NULL DEFAULT '$',
  timezone                text NOT NULL DEFAULT 'UTC',
  date_format             text NOT NULL DEFAULT 'MM/DD/YYYY',
  language                text NOT NULL DEFAULT 'en',
  tax_percentage          numeric(5,2) NOT NULL DEFAULT 0.00,
  default_low_stock_limit integer NOT NULL DEFAULT 10,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Seed one default row if empty
INSERT INTO settings (shop_name, currency, currency_symbol, timezone, date_format, language, tax_percentage, default_low_stock_limit)
SELECT 'ShopFlow', 'USD', '$', 'UTC', 'MM/DD/YYYY', 'en', 0.00, 10
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ─────────────────────────────────────────────
-- USER PREFERENCES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme                   text NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed       boolean NOT NULL DEFAULT false,
  dashboard_default_view  text NOT NULL DEFAULT 'overview'
    CHECK (dashboard_default_view IN ('overview', 'sales', 'inventory', 'orders')),
  items_per_page          integer NOT NULL DEFAULT 10
    CHECK (items_per_page IN (10, 25, 50, 100)),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ─────────────────────────────────────────────
-- ACTIVITY LOGS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   text,
  action      text NOT NULL,
  resource    text NOT NULL,
  resource_id text,
  description text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource   ON activity_logs(resource);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- LOGIN HISTORY TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address  text,
  user_agent  text,
  status      text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id    ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history    ENABLE ROW LEVEL SECURITY;

-- Settings: all authenticated users can read; only admins can write
CREATE POLICY "settings_select_authenticated" ON settings
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "settings_insert_admin" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- User preferences: each user owns their row
CREATE POLICY "user_preferences_select_own" ON user_preferences
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_delete_own" ON user_preferences
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Activity logs: admins and managers can read all; service role inserts
CREATE POLICY "activity_logs_select_admin_manager" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "activity_logs_insert_service" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Login history: user reads own; admins read all; service inserts
CREATE POLICY "login_history_select_own" ON login_history
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "login_history_select_admin" ON login_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "login_history_insert_service" ON login_history
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- ─────────────────────────────────────────────
-- STORAGE BUCKET: shop-assets
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-assets',
  'shop-assets',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "shop_assets_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-assets');

CREATE POLICY "shop_assets_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shop-assets'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "shop_assets_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'shop-assets'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "shop_assets_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'shop-assets'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
