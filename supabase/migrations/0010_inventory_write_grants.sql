-- =============================================================================
-- Zando V2 — Migration 0010 — Inventory Write Grants
-- =============================================================================
-- Grants INSERT on inventory_items and stock_movements to `authenticated`.
--
-- Background: migrations 0005–0009 only granted SELECT on these tables.
-- The RLS policies (from migration 0001) already enforce that:
--   • inventory_items INSERT: platform_admin OR owner of the target shop
--   • stock_movements  INSERT: platform_admin OR shop_id = fn_current_shop_id()
-- Without table-level GRANT INSERT, those RLS checks are never reached.
--
-- No GRANT to anon: opening stock requires an authenticated user so that
-- stock_movements.created_by can reference a real profiles.id.
-- =============================================================================

BEGIN;

-- inventory_items: authenticated users need INSERT so platform_admin and
-- shop_owner can create inventory rows via the application.
GRANT INSERT ON public.inventory_items TO authenticated;

-- stock_movements: authenticated users need INSERT so the opening stock
-- movement can be recorded. The trigger trg_stock_movement_apply then updates
-- inventory_items.quantity_on_hand atomically.
GRANT INSERT ON public.stock_movements TO authenticated;

-- UPDATE on inventory_items is also needed so the trigger can write
-- quantity_on_hand (the trigger runs as postgres/SECURITY DEFINER, but
-- Supabase may require the base role to hold UPDATE for trigger invocation).
GRANT UPDATE ON public.inventory_items TO authenticated;

COMMIT;
