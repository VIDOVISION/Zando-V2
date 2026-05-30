-- Zando V2 — Migration 0003 — Add selling_price and currency to inventory_items
--
-- Each shop may sell the same product at a different retail price, so pricing
-- belongs on inventory_items (per shop × product) rather than the global
-- products catalog.
--
-- selling_price: shop-specific retail price charged to customers.
--               Distinct from supplier_products.unit_price (the shop's cost).
-- currency:      pricing currency, defaults to CDF (Congolese Franc).

BEGIN;

-- selling_price: shop-specific retail price for this product.
-- Nullable — a shop may not have a set selling price immediately.
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS selling_price numeric(12,2);

COMMENT ON COLUMN inventory_items.selling_price IS
    'Shop-specific retail price charged to customers for this product. Distinct from supplier_products.unit_price which is the shop''s purchase cost. Nullable — not every item will have a price set immediately.';

-- currency: pricing currency for selling_price, defaults to CDF.
-- Uses the existing currency_code enum (CDF | USD).
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS currency currency_code DEFAULT 'CDF';

COMMENT ON COLUMN inventory_items.currency IS
    'Currency for selling_price. Defaults to CDF (Congolese Franc). Should match selling_price; NULL when selling_price is NULL. Uses the currency_code enum (CDF | USD).';

COMMIT;
