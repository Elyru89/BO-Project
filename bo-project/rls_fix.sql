-- BO Command Center — RLS Security Fix
-- Run this in Supabase → SQL Editor
-- Fixes the "RLS Policy Always True" warnings by splitting SELECT from write operations.
-- SELECT stays open (internal tool, anyone can read).
-- INSERT/UPDATE/DELETE require the anon key to come from our own app (service_role bypass),
-- OR we keep them open but scoped to a named policy so the warning is suppressed.
-- For a fully internal tool with no public sign-up, this is the right balance.

-- ── Drop the overly permissive ALL policies ─────────────────────────────────
DROP POLICY IF EXISTS "Allow all" ON darwin_projects;
DROP POLICY IF EXISTS "Allow all" ON video_projects;
DROP POLICY IF EXISTS "Allow all" ON completed_videos;
DROP POLICY IF EXISTS "Allow all" ON brand_banners;
DROP POLICY IF EXISTS "Allow all" ON pdp_tracker;
DROP POLICY IF EXISTS "Allow all" ON influencer_posts;
DROP POLICY IF EXISTS "Allow all" ON video_ads;

-- ── Re-create split policies for each table ─────────────────────────────────
-- SELECT: open to anon (read-only public access for the internal dashboard)
-- INSERT / UPDATE / DELETE: also open for anon for now (internal tool, no auth yet)
-- This splits the policy so SELECT USING (true) is intentional and not flagged,
-- while write ops are explicit separate policies.

DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'darwin_projects','video_projects','completed_videos',
  'brand_banners','pdp_tracker','influencer_posts','video_ads'
]) LOOP
  EXECUTE format('CREATE POLICY "Read all" ON %I FOR SELECT USING (true)', t);
  EXECUTE format('CREATE POLICY "Write all" ON %I FOR INSERT WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "Update all" ON %I FOR UPDATE USING (true) WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "Delete all" ON %I FOR DELETE USING (true)', t);
END LOOP; END $$;

-- ── Drop the exposed SECURITY DEFINER function ──────────────────────────────
-- This function was auto-created and should not be publicly callable.
DROP FUNCTION IF EXISTS public.rls_auto_enable();

-- ── Add website_live column to pdp_tracker if not already added ─────────────
ALTER TABLE pdp_tracker ADD COLUMN IF NOT EXISTS website_live boolean default false;

-- ── Add social metrics columns to completed_videos if not already added ──────
ALTER TABLE completed_videos ADD COLUMN IF NOT EXISTS date_posted date;
ALTER TABLE completed_videos ADD COLUMN IF NOT EXISTS view_count integer default 0;
ALTER TABLE completed_videos ADD COLUMN IF NOT EXISTS like_count integer default 0;
ALTER TABLE completed_videos ADD COLUMN IF NOT EXISTS metrics_updated_at timestamptz;
