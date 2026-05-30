-- =============================================================================
-- Zando V2 — Migration 0008 — Fix shops / shop_staff RLS Infinite Recursion
-- =============================================================================
--
-- ROOT CAUSE
-- ----------
-- The shops_select policy (migration 0001) contains an inline subquery:
--
--     id IN (SELECT shop_id FROM shop_staff WHERE user_id = auth.uid())
--
-- PostgreSQL evaluates that subquery in the CURRENT ROLE context, which means
-- it must apply shop_staff's RLS policies. The shop_staff_select policy in turn
-- contains another inline subquery:
--
--     shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
--
-- That re-triggers shops_select, which re-triggers shop_staff_select, and so on.
-- PostgreSQL raises 42P17 "infinite recursion detected in policy for relation".
--
-- WHY SECURITY DEFINER BREAKS THE CYCLE
-- ---------------------------------------
-- A SECURITY DEFINER function runs as its owner (postgres), which holds the
-- BYPASSRLS privilege. Any table access inside such a function skips RLS
-- evaluation entirely. Wrapping the cross-table membership checks in SECURITY
-- DEFINER functions means the policy bodies no longer perform RLS-governed
-- subqueries against each other.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------
-- 1. Creates two helper functions:
--      fn_is_staff_of_shop(p_shop_id)  — checks shop_staff without RLS
--      fn_owns_shop(p_shop_id)         — checks shops.owner_id without RLS
-- 2. Recreates shops_select   using fn_is_staff_of_shop
-- 3. Recreates shop_staff_select/insert/delete using fn_owns_shop
--
-- The anon dev-preview policy (dev_anon_select_shops_demo from migration 0004)
-- is a separate named policy on a different role — it is NOT dropped here.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: fn_is_staff_of_shop
-- Returns true if auth.uid() is a staff member of the given shop.
-- SECURITY DEFINER → runs as postgres, bypasses shop_staff RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_is_staff_of_shop(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM shop_staff
        WHERE shop_id = p_shop_id
          AND user_id = auth.uid()
    )
$$;

-- ---------------------------------------------------------------------------
-- Helper: fn_owns_shop
-- Returns true if auth.uid() is the owner_id of the given shop.
-- SECURITY DEFINER → runs as postgres, bypasses shops RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_owns_shop(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM shops
        WHERE id = p_shop_id
          AND owner_id = auth.uid()
    )
$$;

-- ---------------------------------------------------------------------------
-- shops_select — recreated without the self-recursive shop_staff subquery
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "shops_select" ON public.shops;
CREATE POLICY "shops_select"
    ON public.shops
    FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR owner_id = auth.uid()
        OR fn_is_staff_of_shop(id)   -- SECURITY DEFINER: no RLS on shop_staff
    );

-- ---------------------------------------------------------------------------
-- shop_staff policies — recreated without the self-recursive shops subquery
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "shop_staff_select" ON public.shop_staff;
CREATE POLICY "shop_staff_select"
    ON public.shop_staff
    FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR user_id = auth.uid()
        OR fn_owns_shop(shop_id)     -- SECURITY DEFINER: no RLS on shops
    );

DROP POLICY IF EXISTS "shop_staff_insert" ON public.shop_staff;
CREATE POLICY "shop_staff_insert"
    ON public.shop_staff
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR fn_owns_shop(shop_id)     -- SECURITY DEFINER: no RLS on shops
    );

DROP POLICY IF EXISTS "shop_staff_delete" ON public.shop_staff;
CREATE POLICY "shop_staff_delete"
    ON public.shop_staff
    FOR DELETE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR fn_owns_shop(shop_id)     -- SECURITY DEFINER: no RLS on shops
    );

COMMIT;
