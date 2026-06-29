-- ============================================================
-- Migration 002: Seed — Promote First User to Admin
--
-- Run AFTER you have created your first account via the UI.
-- Replace the email with your own.
-- ============================================================

-- Promote a specific user to admin by email
update public.profiles
set    role = 'admin'
where  email = 'your-admin@example.com';

-- Verify
select id, email, role
from   public.profiles
where  email = 'your-admin@example.com';
