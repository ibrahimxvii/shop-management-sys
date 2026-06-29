-- supabase/migrations/006_employees_rbac.sql
-- ============================================================
-- Migration 006: Employees table + Customer status
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add status column to existing customers table
-- ------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- ------------------------------------------------------------
-- 2. Employees table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name   text        NOT NULL,
  email       text        UNIQUE NOT NULL,
  phone       text,
  avatar_url  text,
  avatar_path text,
  role        text        NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin', 'manager', 'staff')),
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for search
CREATE INDEX IF NOT EXISTS employees_full_name_idx ON public.employees (full_name);
CREATE INDEX IF NOT EXISTS employees_status_idx    ON public.employees (status);

-- updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 3. RLS on employees
-- ------------------------------------------------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;

-- Admin has full access
CREATE POLICY "employees_admin_all"
  ON public.employees FOR ALL
  TO authenticated
  USING  ((SELECT public.get_current_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_current_user_role()) = 'admin');

-- Manager can read employees
CREATE POLICY "employees_manager_select"
  ON public.employees FOR SELECT
  TO authenticated
  USING ((SELECT public.get_current_user_role()) IN ('admin', 'manager'));

-- ------------------------------------------------------------
-- 4. RLS on customers (add if missing from migration 005)
-- ------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

DROP POLICY IF EXISTS "customers_authenticated_all" ON public.customers;
CREATE POLICY "customers_authenticated_all"
  ON public.customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. Storage: employee-avatars bucket
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-avatars',
  'employee-avatars',
  true,
  3145728,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "employee_avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-avatars');

CREATE POLICY "employee_avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-avatars');

CREATE POLICY "employee_avatars_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'employee-avatars'
    AND (SELECT public.get_current_user_role()) = 'admin'
  );

-- ------------------------------------------------------------
-- 6. Storage: profile-avatars bucket
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-avatars' AND (select auth.uid()) IS NOT NULL);

CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-avatars' AND (select auth.uid()) IS NOT NULL);
