-- Zando V2 — Migration 0002 — Add product SKU and active flag
--
-- sku:       The product reference code used in product cards, stock item cards,
--            and order line items. Nullable — not every product will have a SKU
--            immediately. Uniqueness is enforced only when set (partial index).
--
-- is_active: Soft-delete flag matching the pattern used on shops and suppliers.
--            false hides the product from normal catalog queries without
--            destroying data or breaking FK references from inventory/orders.

BEGIN;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sku text;

COMMENT ON COLUMN products.sku IS
    'Product reference code used in product cards, stock, and order lines. Nullable. Uniqueness enforced via partial index idx_products_sku WHERE sku IS NOT NULL.';

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN products.is_active IS
    'Soft-delete flag. false hides the product from normal queries without destroying FK references in inventory_items or order_items.';

-- Partial unique index: only enforce uniqueness when sku is actually set.
-- Multiple NULL values are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products (sku) WHERE sku IS NOT NULL;

COMMIT;
