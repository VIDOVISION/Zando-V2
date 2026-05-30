-- Zando V2 — Migration 0002 — Add sku and is_active to products

BEGIN;

-- Add sku: optional stock-keeping unit code, nullable, uniqueness enforced via
-- partial index when the value is not NULL.
ALTER TABLE products
    ADD COLUMN sku text;

COMMENT ON COLUMN products.sku IS
    'Optional stock-keeping unit code. Nullable. Uniqueness is enforced only when set, via partial index idx_products_sku.';

-- Add is_active: soft-delete flag, same pattern used on shops and suppliers.
ALTER TABLE products
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN products.is_active IS
    'Soft-delete flag. false hides the product from normal queries without destroying data. Matches the pattern used on shops and suppliers.';

-- Partial unique index: uniqueness is only checked when sku IS NOT NULL,
-- so multiple rows may have sku = NULL without violating the constraint.
CREATE UNIQUE INDEX idx_products_sku ON products (sku) WHERE sku IS NOT NULL;

COMMIT;
