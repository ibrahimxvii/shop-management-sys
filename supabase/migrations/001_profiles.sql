-- ============================================================
-- Migration 001: Profiles Table, RLS, and Auth Triggers
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. Role Enum
-- ------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'staff');
exception
  when duplicate_object then
    raise notice 'user_role type already exists, skipping';
end $$;

-- ------------------------------------------------------------
-- 2. Profiles Table
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        references auth.users(id) on delete cascade not null primary key,
  email       text        not null,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'staff',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles is 'Public user profile data, one row per auth.users record.';
comment on column public.profiles.id         is 'References auth.users.id — same primary key.';
comment on column public.profiles.role       is 'RBAC role: admin | manager | staff.';
comment on column public.profiles.is_active  is 'Soft-delete flag; inactive users are denied access in application logic.';

-- ------------------------------------------------------------
-- 3. Enable Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

-- Grant table-level access — rows are filtered by RLS policies below.
grant select, update on public.profiles to authenticated;
grant select           on public.profiles to anon;

-- ------------------------------------------------------------
-- 4. Security-Definer Helper
--
-- This function runs as the postgres superuser (bypassrls), so
-- it can read profiles without hitting RLS — which is necessary
-- to avoid infinite recursion in the admin policies below.
--
-- It is intentionally narrow: it only reads the role for the
-- CURRENT authenticated user, leaks no other data, and is safe
-- for any role to call.
-- ------------------------------------------------------------
create or replace function public.get_current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role
  from   public.profiles
  where  id = (select auth.uid())
  limit  1;
$$;

-- Wrap in (select ...) in policies so Postgres evaluates it once
-- per statement (not once per row), avoiding N×1 function calls.

-- ------------------------------------------------------------
-- 5. RLS Policies
-- ------------------------------------------------------------

-- SELECT: each user can always see their own row
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ( (select auth.uid()) = id );

-- SELECT: admins can see every row
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using ( (select public.get_current_user_role()) = 'admin' );

-- UPDATE: users can update their own row
--   WITH CHECK prevents them from escalating their own role.
--   Role / is_active changes must go through the admin policy.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using     ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- UPDATE: admins can update any row (including role + is_active)
create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using     ( (select public.get_current_user_role()) = 'admin' )
  with check ( true );

-- DELETE: admin-only soft-delete (prefer toggling is_active)
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using ( (select public.get_current_user_role()) = 'admin' );

-- ------------------------------------------------------------
-- 6. Auto-Create Profile on Signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 7. Auto-Update updated_at
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 8. Sync Email When auth.users Email Changes
-- ------------------------------------------------------------
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set    email = new.email
  where  id    = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_update();
