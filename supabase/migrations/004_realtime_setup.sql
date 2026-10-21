-- ==============================================================================
-- 004_realtime_setup.sql
-- Enables REPLICA IDENTITY FULL and verifies Realtime publication
-- Ensures all mobile and desktop clients receive instant push updates for new players,
-- balances, debt approvals, and transactions.
-- ==============================================================================

-- 1. Ensure REPLICA IDENTITY FULL so PostgreSQL sends full record diffs to Supabase Realtime
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.debts REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- 2. Add tables to supabase_realtime publication if not already present
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;
END $$;
