-- =============================================================================
-- Zando V2 — Migration 0007 — Platform Admin Product Write Grants & Policies
-- =============================================================================
--
-- BACKGROUND
-- ----------
-- Migrations 0001–0006 left a gap: the `authenticated` role had RLS policies
-- allowing platform_admin to INSERT and UPDATE products, but the table-level
-- GRANT for those operations was never issued. PostgreSQL checks GRANT before
-- evaluating RLS, so authenticated platform_admin users received
-- "42501 permission denied for table products" on every insert attempt.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------
-- 1. Grants INSERT and UPDATE on products to `authenticated`.
--    The `anon` role does NOT receive write grants — dev-preview anon access
--    remains read-only as established in migrations 0004 and 0005.
--
-- 2. Recreates the products INSERT and UPDATE RLS policies idempotently
--    (DROP IF EXISTS + CREATE) so the access rules are explicit, auditable,
--    and survive future schema resets.
--
-- CORRECT WRITE MODEL
-- -------------------
--   GRANT:  authenticated role → INSERT, UPDATE on products
--   RLS:    fn_current_role() = 'platform_admin'  →  INSERT / UPDATE allowed
--           all other authenticated roles          →  INSERT / UPDATE blocked
--   Result: only a logged-in platform_admin can write products.
--           Anonymous and non-admin authenticated users are blocked at RLS.
--
-- RERUNNABLE
--   Uses DROP POLICY IF EXISTS before each CREATE POLICY.
--   GRANT is a no-op if the privilege already exists.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1 — Table-level grants
-- ---------------------------------------------------------------------------

-- Authenticated users need INSERT and UPDATE at the table level so Postgres
-- does not short-circuit before reaching the RLS policy check.
-- SELECT was already granted in migration 0005.
GRANT INSERT, UPDATE ON public.products TO authenticated;

-- Explicitly confirm that anon keeps only SELECT (additive, harmless if already set).
GRANT SELECT ON public.products TO anon;

-- ---------------------------------------------------------------------------
-- Step 2 — RLS policies (idempotent recreate)
-- ---------------------------------------------------------------------------

-- SELECT: every authenticated user may read the product catalog.
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: only platform_admin may add products.
DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

-- UPDATE: only platform_admin may edit products.
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING  (fn_current_role() = 'platform_admin')
    WITH CHECK (fn_current_role() = 'platform_admin');

-- DELETE: only platform_admin may delete products.
-- Included here for completeness; soft-delete (is_active = false) is preferred.
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

COMMIT;

-- =============================================================================
-- How to set up a platform_admin account for product creation
-- =============================================================================
-- 1. Create a user via: Supabase dashboard → Authentication → Users → Add user.
-- 2. The trigger trg_create_profile_on_signup auto-creates a profiles row
--    with role = 'shop_owner'.
-- 3. Promote to platform_admin:
--      UPDATE public.profiles
--      SET role = 'platform_admin'
--      WHERE id = '<your-auth-uid>';
-- 4. Log in with that account at /login.
-- 5. Navigate to /products and click "+ Nouveau".
-- =============================================================================
