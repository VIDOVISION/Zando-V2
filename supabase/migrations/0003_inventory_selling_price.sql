-- Zando V2 — Migration 0003 — Add selling_price to inventory_items

BEGIN;

-- Add selling_price: the shop's per-unit selling price for this product.
-- Nullable — not every item will have a set selling price immediately.
-- No CHECK constraint; negative prices are not expected but left unconstrained
-- for flexibility (e.g. promotional adjustments).
ALTER TABLE inventory_items
    ADD COLUMN selling_price numeric(12,2);

COMMENT ON COLUMN inventory_items.selling_price IS
    'The shop''s per-unit selling price for this product (what the shop charges customers). Distinct from supplier_products.unit_price which is the shop''s cost. Nullable — not every item will have a price set immediately.';

-- Add currency: the currency that applies to selling_price.
-- Nullable — should be NULL when selling_price is NULL.
-- Uses the existing currency_code enum (CDF | USD).
ALTER TABLE inventory_items
    ADD COLUMN currency currency_code;

COMMENT ON COLUMN inventory_items.currency IS
    'Currency for selling_price. Must be set when selling_price is set; NULL when selling_price is NULL. Uses the currency_code enum (CDF | USD).';

COMMIT;
