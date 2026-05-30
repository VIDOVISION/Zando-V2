-- =============================================================================
-- Zando V2 — Migration 0009 — Fix shop_staff Access for RLS Checks
-- =============================================================================
--
-- ROOT CAUSE
-- ----------
-- profiles_select (migration 0001) contains an inline subquery:
--
--     OR id IN (
--         SELECT ss.user_id
--         FROM shop_staff ss
--         INNER JOIN shops s ON s.id = ss.shop_id
--         WHERE s.owner_id = auth.uid()
--     )
--
-- This runs in the calling role's RLS context, not a SECURITY DEFINER context.
-- When a query joins profiles (e.g. stock_movements creator join), PostgreSQL
-- must evaluate profiles_select for every matched profile row. The inline
-- subquery requires SELECT on shop_staff. The authenticated role didn't have
-- this GRANT, causing 42501. The anon role also lacked it, meaning dev preview
-- stock movement reads failed the same way.
--
-- WHY NOT JUST GRANT SELECT TO anon
-- -----------------------------------
-- Granting SELECT on shop_staff to anon would expose staff membership data to
-- unauthenticated requests. Instead, we fix the policy to use a SECURITY
-- DEFINER function (runs as postgres, bypasses RLS). Then anon never needs a
-- direct GRANT on shop_staff — the helper queries it without triggering RLS.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------
-- 1. GRANT SELECT on shop_staff to authenticated (for direct auth queries
--    and as a safety net for policy evaluation paths).
-- 2. Creates fn_is_staff_visible_to_current_owner(p_user_id) — SECURITY
--    DEFINER helper that replaces the inline shop_staff + shops join inside
--    profiles_select.
-- 3. Recreates profiles_select using the new helper — no more bare cross-table
--    subquery in the policy body.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1 — Table-level GRANT for shop_staff
-- ---------------------------------------------------------------------------
-- authenticated needs SELECT so it can query shop_staff for staff management
-- features (e.g. listing staff, shop context resolution).
-- The existing shop_staff_select RLS policy still limits which rows are visible.
--
-- anon does NOT receive this GRANT. The fn_is_staff_visible_to_current_owner
-- function (step 2) runs as postgres (BYPASSRLS), so anon queries that
-- evaluate profiles_select do not require direct shop_staff access.
GRANT SELECT ON public.shop_staff TO authenticated;

-- ---------------------------------------------------------------------------
-- Step 2 — SECURITY DEFINER helper for profiles_select
-- ---------------------------------------------------------------------------
-- Returns true if p_user_id is a staff member of any shop owned by auth.uid().
-- Runs as postgres → bypasses RLS on shop_staff and shops, so no recursive
-- policy evaluation and no GRANT requirement on the calling role.
CREATE OR REPLACE FUNCTION fn_is_staff_visible_to_current_owner(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM shop_staff ss
        INNER JOIN shops s ON s.id = ss.shop_id
        WHERE ss.user_id   = p_user_id
          AND s.owner_id   = auth.uid()
    )
$$;

-- ---------------------------------------------------------------------------
-- Step 3 — Recreate profiles_select without the bare cross-table subquery
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR fn_current_role() = 'platform_admin'
        -- shop_owner can see profiles of staff in their shop;
        -- using SECURITY DEFINER helper to avoid bare shop_staff subquery
        OR fn_is_staff_visible_to_current_owner(id)
    );

COMMIT;
