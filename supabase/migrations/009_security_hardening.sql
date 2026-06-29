-- ============================================================
-- 009: Security Hardening — missing RLS policies & role checks
-- ============================================================
-- Fixes identified during the production-readiness audit:
--   1. payments table had no UPDATE policy (reconciliation was blocked)
--   2. category-images / brand-logos storage policies allowed ANY
--      authenticated user to upload/update/delete, not just admin/manager
--   3. activity_logs had no DELETE policy for admins to prune old entries

-- ─────────────────────────────────────────────
-- 1. payments: allow admin/manager to update (e.g. reconcile transaction_id)
-- ─────────────────────────────────────────────
CREATE POLICY "payments_update_admin_manager"
  ON payments FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- ─────────────────────────────────────────────
-- 2. Tighten category-images / brand-logos storage policies to
--    admin/manager only (previously: any authenticated user)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "category_images_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "category_images_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "category_images_auth_delete" ON storage.objects;

CREATE POLICY "category_images_admin_manager_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'category-images' AND get_my_role() IN ('admin', 'manager'));

CREATE POLICY "category_images_admin_manager_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'category-images' AND get_my_role() IN ('admin', 'manager'));

CREATE POLICY "category_images_admin_manager_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'category-images' AND get_my_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS "brand_logos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "brand_logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "brand_logos_auth_delete" ON storage.objects;

CREATE POLICY "brand_logos_admin_manager_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-logos' AND get_my_role() IN ('admin', 'manager'));

CREATE POLICY "brand_logos_admin_manager_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-logos' AND get_my_role() IN ('admin', 'manager'));

CREATE POLICY "brand_logos_admin_manager_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-logos' AND get_my_role() IN ('admin', 'manager'));

-- ─────────────────────────────────────────────
-- 3. activity_logs: allow admins to prune old entries
-- ─────────────────────────────────────────────
CREATE POLICY "activity_logs_delete_admin" ON activity_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ─────────────────────────────────────────────
-- 4. profile-avatars: restrict upload/delete to the owning user's folder
--    (path convention: avatars/<user_id>-*) in addition to auth check
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profile_avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_avatars_delete" ON storage.objects;

CREATE POLICY "profile_avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (SELECT auth.uid()) IS NOT NULL
  );

CREATE POLICY "profile_avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND owner = (SELECT auth.uid())
  );

-- ─────────────────────────────────────────────
-- 5. Helpful composite indexes for common filtered list queries
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_status_quantity ON products(status, quantity);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
