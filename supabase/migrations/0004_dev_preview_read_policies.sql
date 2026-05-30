-- =============================================================================
-- Zando V2 — Migration 0004 — Dev Preview Anon Read Policies
-- =============================================================================
-- !! DEVELOPMENT ONLY — DO NOT APPLY TO PRODUCTION !!
--
-- PURPOSE:
--   Allows the `anon` role (unauthenticated Supabase requests) to READ a
--   restricted subset of seeded demo data so that /products and /stock render
--   real data in dev preview mode (ZANDO_DEV_PREVIEW=true) without a login.
--
-- SCOPE:
--   All policies are scoped to the demo organization / demo shop by name,
--   not broad table-wide access.
--
-- IMPACT ON PRODUCTION:
--   These policies add `TO anon` SELECT rules. In a production Supabase project
--   that has no demo seed data, the policies evaluate to an empty set (no rows
--   match the name conditions) and are harmless. However, this migration should
--   still NOT be applied to production as a matter of hygiene.
--   Apply migrations 0001–0003 to production; leave 0004 dev-only.
--
-- IDEMPOTENT:
--   Uses DROP POLICY IF EXISTS before each CREATE POLICY.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. product_categories
--    No org/shop link — these are global catalog data. Allow anon to read all rows.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_product_categories" ON public.product_categories;
CREATE POLICY "dev_anon_select_product_categories"
    ON public.product_categories
    FOR SELECT
    TO anon
    USING (true);

-- -----------------------------------------------------------------------------
-- 2. products
--    Global catalog. Allow anon to read only active products.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_products" ON public.products;
CREATE POLICY "dev_anon_select_products"
    ON public.products
    FOR SELECT
    TO anon
    USING (is_active = true);

-- -----------------------------------------------------------------------------
-- 3. profiles
--    Needed so the created_by FK join in stock_movements returns the creator name.
--    Restrict to the demo profile only.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_profiles_demo" ON public.profiles;
CREATE POLICY "dev_anon_select_profiles_demo"
    ON public.profiles
    FOR SELECT
    TO anon
    USING (id = '10000000-0000-0000-0000-000000000002'::uuid);

-- -----------------------------------------------------------------------------
-- 4. shops
--    Needed so getCurrentShopId can find the demo shop by owner_id.
--    Restrict to demo shop by name.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_shops_demo" ON public.shops;
CREATE POLICY "dev_anon_select_shops_demo"
    ON public.shops
    FOR SELECT
    TO anon
    USING (name = 'Boutique Demo Kinshasa');

-- -----------------------------------------------------------------------------
-- 5. inventory_items
--    Allow anon to read inventory for the demo shop.
--
--    NOTE on RLS subquery evaluation: the subquery on `shops` executes as the
--    `anon` role. Policy dev_anon_select_shops_demo permits anon to read the
--    row where name = 'Boutique Demo Kinshasa', so the subquery correctly
--    returns the demo shop ID. SECURITY DEFINER is intentionally not used here
--    to keep the restriction tight to the demo shop.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_inventory_items_demo" ON public.inventory_items;
CREATE POLICY "dev_anon_select_inventory_items_demo"
    ON public.inventory_items
    FOR SELECT
    TO anon
    USING (
        shop_id IN (
            SELECT id FROM public.shops
            WHERE name = 'Boutique Demo Kinshasa'
        )
    );

-- -----------------------------------------------------------------------------
-- 6. stock_movements
--    Allow anon to read movements for the demo shop.
--    Same subquery pattern as inventory_items.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dev_anon_select_stock_movements_demo" ON public.stock_movements;
CREATE POLICY "dev_anon_select_stock_movements_demo"
    ON public.stock_movements
    FOR SELECT
    TO anon
    USING (
        shop_id IN (
            SELECT id FROM public.shops
            WHERE name = 'Boutique Demo Kinshasa'
        )
    );

COMMIT;

-- To verify: after applying this migration and the seed, run in Supabase SQL Editor:
--   SET ROLE anon;
--   SELECT name FROM products LIMIT 5;
--   SELECT quantity_on_hand FROM inventory_items LIMIT 5;
--   RESET ROLE;
-- Both queries should return rows.
