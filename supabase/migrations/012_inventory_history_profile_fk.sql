-- ============================================================
-- Migration 012: Fix inventory_history → profiles relationship
--
-- Bug: services/inventory.service.ts embeds `user:profiles(id, full_name,
-- email)` when fetching inventory history, but inventory_history.user_id
-- has a foreign key to auth.users(id), not profiles(id). PostgREST can
-- only auto-resolve an embedded select when a direct FK connects the two
-- tables being queried, so this join fails with "Could not find a
-- relationship between 'inventory_history' and 'profiles'" — surfaced in
-- the UI as "Failed to load history."
--
-- Fix: repoint the FK at profiles(id) instead. profiles.id always mirrors
-- auth.users.id 1:1 (profiles.id itself references auth.users(id), see
-- 001_profiles.sql), so this is a safe, data-preserving change — it just
-- gives PostgREST the direct relationship it needs.
-- ============================================================

ALTER TABLE inventory_history
  DROP CONSTRAINT IF EXISTS inventory_history_user_id_fkey;

ALTER TABLE inventory_history
  ADD CONSTRAINT inventory_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
