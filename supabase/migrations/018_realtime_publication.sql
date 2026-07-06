-- ============================================================
-- Migration 018: Realtime publication
-- Adds orders, notifications, and activity_logs to the
-- supabase_realtime publication so postgres_changes subscriptions can
-- receive them. Idempotent — safe to re-run. RLS still applies to
-- realtime delivery, so no new access-control surface is introduced:
-- notifications/activity_logs subscribers only ever receive rows they
-- could already SELECT.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
  END IF;
END $$;
