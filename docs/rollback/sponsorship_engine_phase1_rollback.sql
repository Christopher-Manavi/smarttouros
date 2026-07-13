-- =============================================================================
-- Sponsorship Engine Phase 1 — ROLLBACK REFERENCE
--
-- ⚠️  DO NOT PLACE THIS FILE UNDER supabase/migrations/.
-- ⚠️  Placing it there will cause it to run as a normal migration and delete
--     the entire Sponsorship Engine module.
--
-- This file is a manual teardown script kept for reference only. It should be
-- executed by a database operator (via psql) ONLY if a full removal of the
-- Sponsorship Engine has been authorized.
--
-- Preferred rollback: set SPONSORSHIP_ENGINE_ENABLED=false and
-- VITE_SPONSORSHIP_ENGINE_ENABLED=false. That returns the app to its
-- pre-Sponsorship state without touching data.
--
-- No object outside the sponsorship_* namespace is referenced here.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS public.sponsorship_audit_events CASCADE;
DROP TABLE IF EXISTS public.sponsorship_matches CASCADE;
DROP TABLE IF EXISTS public.sponsorship_lenders CASCADE;
DROP TABLE IF EXISTS public.sponsorship_agents CASCADE;
DROP TABLE IF EXISTS public.sponsorship_campaigns CASCADE;

DROP TYPE IF EXISTS public.sponsorship_match_status;

COMMIT;
