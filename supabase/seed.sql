-- =============================================================================
-- Zando V2 — Development Seed Data
-- =============================================================================
-- PURPOSE: Local development and demo only. DO NOT run in production.
--
-- HOW TO RUN:
--   Option A — Supabase CLI (recommended):
--     supabase db reset        <- applies all migrations then runs this file
--
--   Option B — Supabase SQL Editor:
--     Paste the contents of this file into the SQL Editor and click Run.
--     Safe to run multiple times (idempotent for all tables with unique constraints;
--     stock_movements inserts are guarded by a quantity_on_hand = 0 check).
--
-- WHAT IS SEEDED:
--   * 1 demo organization  (Zando Demo)
--   * 1 demo shop          (Boutique Demo Kinshasa)
--   * 1 demo profile       (Patron Demo — shop_owner role, no auth.users entry)
--   * 4 product categories (Boissons, Eau, Bieres, Jus)
--   * 9 products           (Congolese market beverages)
--   * 9 inventory items    (linked to the demo shop)
--   * 9 stock movements    (opening stock, purchase_in)
--
-- NOTE ON AUTHENTICATION:
--   The demo profile (id = 10000000-...-0002) has NO entry in auth.users.
--   It cannot be used to log in. It exists only to satisfy FK constraints
--   on shops.owner_id and stock_movements.created_by.
--   To log in and test the app, create a real user via the Supabase Auth dashboard
--   and update their profile.role to 'shop_owner' or 'platform_admin'.
-- =============================================================================

DO $seed$
DECLARE
  -- Organization
  demo_org_id     uuid := '10000000-0000-0000-0000-000000000001';
  -- Profile
  demo_profile_id uuid := '10000000-0000-0000-0000-000000000002';
  -- Shop
  demo_shop_id    uuid := '10000000-0000-0000-0000-000000000003';
  -- Product categories
  cat_boissons    uuid := '10000000-0000-0000-0000-000000000010';
  cat_eau         uuid := '10000000-0000-0000-0000-000000000011';
  cat_bieres      uuid := '10000000-0000-0000-0000-000000000012';
  cat_jus         uuid := '10000000-0000-0000-0000-000000000013';
  -- Products
  prod_fanta      uuid := '10000000-0000-0000-0000-000000000020';
  prod_vitalo     uuid := '10000000-0000-0000-0000-000000000021';
  prod_nkoyi_b    uuid := '10000000-0000-0000-0000-000000000022';
  prod_nkoyi_bl   uuid := '10000000-0000-0000-0000-000000000023';
  prod_beaufort   uuid := '10000000-0000-0000-0000-000000000024';
  prod_heineken   uuid := '10000000-0000-0000-0000-000000000025';
  prod_castel     uuid := '10000000-0000-0000-0000-000000000026';
  prod_tembo      uuid := '10000000-0000-0000-0000-000000000027';
  prod_eau_vive   uuid := '10000000-0000-0000-0000-000000000028';
  -- Inventory items
  inv_fanta       uuid := '10000000-0000-0000-0000-000000000030';
  inv_vitalo      uuid := '10000000-0000-0000-0000-000000000031';
  inv_nkoyi_b     uuid := '10000000-0000-0000-0000-000000000032';
  inv_nkoyi_bl    uuid := '10000000-0000-0000-0000-000000000033';
  inv_beaufort    uuid := '10000000-0000-0000-0000-000000000034';
  inv_heineken    uuid := '10000000-0000-0000-0000-000000000035';
  inv_castel      uuid := '10000000-0000-0000-0000-000000000036';
  inv_tembo       uuid := '10000000-0000-0000-0000-000000000037';
  inv_eau_vive    uuid := '10000000-0000-0000-0000-000000000038';
BEGIN

  -- -------------------------------------------------------------------------
  -- 1. Organization
  --    owner_id is NULL here; updated after the profile is inserted (step 3).
  -- -------------------------------------------------------------------------
  INSERT INTO organizations (id, name, owner_id)
  VALUES (demo_org_id, 'Zando Demo', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 2. Profile (demo shop owner)
  --    No auth.users entry is created. This profile exists only to satisfy FK
  --    constraints on shops.owner_id and stock_movements.created_by.
  --    It cannot be used to authenticate.
  -- -------------------------------------------------------------------------
  INSERT INTO profiles (id, organization_id, full_name, phone, role)
  VALUES (
    demo_profile_id,
    demo_org_id,
    'Patron Demo',
    '+243810000001',
    'shop_owner'
  )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 3. Link organization owner now that the profile row exists
  -- -------------------------------------------------------------------------
  UPDATE organizations
  SET owner_id = demo_profile_id
  WHERE id = demo_org_id
    AND owner_id IS NULL;

  -- -------------------------------------------------------------------------
  -- 4. Shop
  -- -------------------------------------------------------------------------
  INSERT INTO shops (
    id, organization_id, owner_id,
    name, phone, address, city, is_active
  )
  VALUES (
    demo_shop_id,
    demo_org_id,
    demo_profile_id,
    'Boutique Demo Kinshasa',
    '+243810000002',
    'Avenue du Commerce 42, Gombe',
    'Kinshasa',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 5. Product categories
  -- -------------------------------------------------------------------------
  INSERT INTO product_categories (id, name, slug)
  VALUES
    (cat_boissons, 'Boissons', 'boissons'),
    (cat_eau,      'Eau',      'eau'),
    (cat_bieres,   'Bières',   'bieres'),
    (cat_jus,      'Jus',      'jus')
  ON CONFLICT (slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 6. Products
  -- -------------------------------------------------------------------------
  INSERT INTO products (id, category_id, name, slug, description, unit, sku, is_active)
  VALUES
    (prod_fanta,    cat_jus,    'Fanta Orange 50cl', 'fanta-orange-50cl', 'Soda orange Fanta bouteille 50cl', 'bouteille', 'FAO50',  true),
    (prod_vitalo,   cat_jus,    'Vitalo 50cl',       'vitalo-50cl',       'Jus Vitalo bouteille 50cl',        'bouteille', 'VIT50',  true),
    (prod_nkoyi_b,  cat_bieres, 'Nkoyi Blonde',      'nkoyi-blonde',      'Bière Nkoyi Blonde 33cl',          'bouteille', 'NKB33',  true),
    (prod_nkoyi_bl, cat_bieres, 'Nkoyi Black',       'nkoyi-black',       'Bière Nkoyi Black 33cl',           'bouteille', 'NKBL33', true),
    (prod_beaufort, cat_bieres, 'Beaufort',          'beaufort',          'Bière Beaufort 65cl',              'bouteille', 'BEA65',  true),
    (prod_heineken, cat_bieres, 'Heineken',          'heineken',          'Bière Heineken 33cl',              'bouteille', 'HEI33',  true),
    (prod_castel,   cat_bieres, 'Castel',            'castel',            'Bière Castel 65cl',                'bouteille', 'CAS65',  true),
    (prod_tembo,    cat_bieres, 'Tembo',             'tembo',             'Bière Tembo 65cl',                 'bouteille', 'TEM65',  true),
    (prod_eau_vive, cat_eau,    'Eau Vive 50cl',     'eau-vive-50cl',     'Eau minérale Eau Vive 50cl',       'bouteille', 'EAV50',  true)
  ON CONFLICT (slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 7. Inventory items
  --    quantity_on_hand starts at 0. The trigger on stock_movements will set
  --    it when the opening-stock movements are inserted in step 8.
  -- -------------------------------------------------------------------------
  INSERT INTO inventory_items (
    id, shop_id, product_id,
    quantity_on_hand, min_quantity,
    selling_price, currency
  )
  VALUES
    (inv_fanta,    demo_shop_id, prod_fanta,    0, 12,  850,  'CDF'),
    (inv_vitalo,   demo_shop_id, prod_vitalo,   0, 12,  750,  'CDF'),
    (inv_nkoyi_b,  demo_shop_id, prod_nkoyi_b,  0, 24,  2200, 'CDF'),
    (inv_nkoyi_bl, demo_shop_id, prod_nkoyi_bl, 0, 24,  2200, 'CDF'),
    (inv_beaufort, demo_shop_id, prod_beaufort, 0, 12,  2500, 'CDF'),
    (inv_heineken, demo_shop_id, prod_heineken, 0, 12,  3500, 'CDF'),
    (inv_castel,   demo_shop_id, prod_castel,   0, 12,  2000, 'CDF'),
    (inv_tembo,    demo_shop_id, prod_tembo,    0, 12,  2000, 'CDF'),
    (inv_eau_vive, demo_shop_id, prod_eau_vive, 0, 24,  500,  'CDF')
  ON CONFLICT (shop_id, product_id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 8. Stock movements — opening stock (purchase_in)
  --    Each INSERT fires trg_stock_movement_apply which updates
  --    inventory_items.quantity_on_hand automatically.
  --    Guard: only insert if quantity_on_hand is still 0 so that re-running
  --    this script does not double-count stock.
  -- -------------------------------------------------------------------------
  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_fanta) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_fanta, demo_shop_id, prod_fanta,
      'purchase_in', 48, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_vitalo) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_vitalo, demo_shop_id, prod_vitalo,
      'purchase_in', 24, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_nkoyi_b) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_nkoyi_b, demo_shop_id, prod_nkoyi_b,
      'purchase_in', 96, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_nkoyi_bl) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_nkoyi_bl, demo_shop_id, prod_nkoyi_bl,
      'purchase_in', 48, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_beaufort) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_beaufort, demo_shop_id, prod_beaufort,
      'purchase_in', 60, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_heineken) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_heineken, demo_shop_id, prod_heineken,
      'purchase_in', 48, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_castel) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_castel, demo_shop_id, prod_castel,
      'purchase_in', 72, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_tembo) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_tembo, demo_shop_id, prod_tembo,
      'purchase_in', 36, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

  IF (SELECT quantity_on_hand FROM inventory_items WHERE id = inv_eau_vive) = 0 THEN
    INSERT INTO stock_movements (
      id, inventory_item_id, shop_id, product_id,
      movement_type, quantity, reference_type, note, created_by
    ) VALUES (
      gen_random_uuid(), inv_eau_vive, demo_shop_id, prod_eau_vive,
      'purchase_in', 120, 'manual', 'Stock d''ouverture', demo_profile_id
    );
  END IF;

END $seed$;
