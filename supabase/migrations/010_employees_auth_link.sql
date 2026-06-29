-- ============================================================
-- Migration 010: Link employees to real login accounts
--
-- Employees previously had a `role` column that had no effect on
-- anything — RBAC is driven entirely by `profiles.role`, which is
-- tied to an `auth.users` row. This adds a nullable link so that
-- creating/editing/deleting an employee can also manage their
-- actual Supabase Auth account + profile role.
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_user_id_idx ON public.employees (user_id);
