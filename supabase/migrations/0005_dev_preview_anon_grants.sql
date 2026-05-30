-- =============================================================================
-- Zando V2 — Migration 0005 — Dev Preview Anon Table Grants
-- =============================================================================
-- !! DEVELOPMENT ONLY — DO NOT APPLY TO PRODUCTION !!
--
-- PURPOSE:
--   In Postgres, Row-Level Security policies and table-level GRANTs are two
--   separate access layers. Migration 0004 added RLS policies for the `anon`
--   role, but the `anon` role still lacked GRANT SELECT on the tables, which
--   causes error 42501 ("permission denied for table ...") before RLS is
--   even evaluated.
--
--   This migration grants SELECT to the `anon` role on the tables needed for
--   dev preview reads of seeded demo data. RLS policies (from migration 0004)
--   still restrict WHICH rows are visible to anon.
--
--   The `authenticated` role is also granted here so that future new tables
--   added to the schema don't require a separate grant migration in dev.
--   In a Supabase-managed project, `authenticated` typically already has these
--   grants from the Supabase default setup; including them here is a no-op.
--
-- IMPACT ON PRODUCTION:
--   SELECT grants to `anon` in production expose these tables to unauthenticated
--   requests. RLS policies on production tables use `TO authenticated` only,
--   so anon queries return zero rows — but granting SELECT to `anon` is still
--   unnecessary exposure. Do NOT apply this migration to production.
--
-- APPLY TO:   local development database only
-- DO NOT APPLY TO: staging, production
-- =============================================================================

BEGIN;

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT SELECT ON public.products           TO anon, authenticated;
GRANT SELECT ON public.shops              TO anon, authenticated;
GRANT SELECT ON public.profiles           TO anon, authenticated;
GRANT SELECT ON public.inventory_items    TO anon, authenticated;
GRANT SELECT ON public.stock_movements    TO anon, authenticated;

COMMIT;

-- To verify after applying:
--   SET ROLE anon;
--   SELECT count(*) FROM public.products;        -- should return 9
--   SELECT count(*) FROM public.inventory_items; -- should return 9
--   RESET ROLE;
