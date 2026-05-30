-- Zando V2 — Core Schema — Migration 0001
-- Merchant Operating System for Congolese retail shops, suppliers, and delivery operators.
-- All timestamps are stored UTC. RLS is enabled on every table.
-- quantity_on_hand may only be changed via stock_movements INSERT → trigger, never directly.
-- Source of truth: zando-docs/database-schema.md

BEGIN;

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
-- gen_random_uuid() is built-in from Postgres 13+; no extension required.
-- pgcrypto is enabled for completeness in case the Supabase version needs it.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'platform_admin',
    'shop_owner',
    'shop_staff',
    'supplier',
    'delivery_operator'
);

-- adjustment_in and adjustment_out are explicit so quantity is always positive.
-- Direction is encoded in the type, never the sign.
CREATE TYPE movement_type AS ENUM (
    'purchase_in',
    'sale_out',
    'adjustment_in',
    'adjustment_out',
    'damage',
    'transfer_in',
    'transfer_out'
);

CREATE TYPE order_status AS ENUM (
    'draft',
    'submitted',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE delivery_status AS ENUM (
    'pending',
    'in_transit',
    'delivered',
    'failed'
);

CREATE TYPE payment_method AS ENUM (
    'cash',
    'mobile_money',
    'bank_transfer'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

-- Explicit enum so currency is never ambiguous.
CREATE TYPE currency_code AS ENUM (
    'CDF',
    'USD'
);

-- ---------------------------------------------------------------------------
-- FUNCTION: fn_set_updated_at
-- BEFORE UPDATE trigger used on all tables with an updated_at column.
-- Must be created before the triggers that reference it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TABLE: organizations
-- Top-level business entity grouping shops and suppliers.
-- owner_id FK is a deferred addition — profiles does not exist yet.
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    owner_id    uuid,                        -- FK → profiles.id added below
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS 'Top-level business entity that groups one or more shops and suppliers under a single owner.';

CREATE TRIGGER trg_set_updated_at_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- Extends auth.users. id = auth.uid(). One row per authenticated user.
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
    id              uuid        PRIMARY KEY,     -- = auth.uid()
    organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
    full_name       text        NOT NULL,
    phone           text,
    role            user_role   NOT NULL DEFAULT 'shop_owner',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'One row per authenticated user. id matches auth.users.id (auth.uid()). Never reference auth.users directly from application tables — always join through profiles.';

CREATE TRIGGER trg_set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Deferred FK: organizations.owner_id → profiles.id
ALTER TABLE organizations
    ADD CONSTRAINT fk_organizations_owner
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- FUNCTION: fn_create_profile_on_signup
-- Fires on auth.users AFTER INSERT to auto-create a profiles row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_create_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'shop_owner'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION fn_create_profile_on_signup();

-- ---------------------------------------------------------------------------
-- TABLE: shops
-- Single retail location. Soft-delete via is_active.
-- ---------------------------------------------------------------------------
CREATE TABLE shops (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
    owner_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    name            text        NOT NULL,
    phone           text,
    address         text,
    city            text,
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE shops IS 'A single retail location owned by a shop_owner profile. is_active = false is the soft-delete pattern.';

CREATE INDEX idx_shops_owner_id        ON shops (owner_id);
CREATE INDEX idx_shops_organization_id ON shops (organization_id);

CREATE TRIGGER trg_set_updated_at_shops
    BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: shop_staff
-- Links a shop_staff profile to exactly one shop.
-- UNIQUE(user_id) enforces one-shop-per-staff in MVP.
-- ---------------------------------------------------------------------------
CREATE TABLE shop_staff (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id    uuid        NOT NULL REFERENCES shops(id)   ON DELETE CASCADE,
    user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_shop_staff_user UNIQUE (user_id)
);

COMMENT ON TABLE shop_staff IS 'Links a shop_staff profile to exactly one shop. UNIQUE(user_id) enforces one-shop-per-staff in MVP.';

CREATE INDEX idx_shop_staff_shop_id ON shop_staff (shop_id);

-- ---------------------------------------------------------------------------
-- TABLE: product_categories
-- Flat taxonomy for the global product catalog.
-- ---------------------------------------------------------------------------
CREATE TABLE product_categories (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text        NOT NULL,
    slug       text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_categories_slug UNIQUE (slug)
);

COMMENT ON TABLE product_categories IS 'Flat taxonomy for the global product catalog (e.g. alimentation, boissons, hygiene). Managed by platform_admin only.';

-- ---------------------------------------------------------------------------
-- TABLE: products
-- Global product catalog shared across all shops.
-- Managed exclusively by platform_admin.
-- ---------------------------------------------------------------------------
CREATE TABLE products (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid        REFERENCES product_categories(id) ON DELETE SET NULL,
    name        text        NOT NULL,
    slug        text        NOT NULL,
    description text,
    unit        text        NOT NULL DEFAULT 'piece',
    image_url   text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_slug UNIQUE (slug)
);

COMMENT ON TABLE products IS 'Global product catalog shared across all shops. Managed exclusively by platform_admin. Never store shop-specific pricing here.';

CREATE INDEX idx_products_category_id ON products (category_id);

CREATE TRIGGER trg_set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: suppliers
-- Business that sells products to shops.
-- user_id is nullable — supplier may not have a Zando account yet.
-- Soft-delete via is_active.
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
    user_id         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    name            text        NOT NULL,
    contact_name    text,
    phone           text,
    email           text,
    address         text,
    city            text,
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suppliers IS 'A business that sells products to shops. user_id is nullable — supplier may not have a Zando account yet. is_active = false is the soft-delete pattern.';

CREATE INDEX idx_suppliers_user_id ON suppliers (user_id);

CREATE TRIGGER trg_set_updated_at_suppliers
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: supplier_products
-- Products a supplier carries with their price.
-- UNIQUE(supplier_id, product_id).
-- ---------------------------------------------------------------------------
CREATE TABLE supplier_products (
    id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid           NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id  uuid           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    unit_price  numeric(12,2)  NOT NULL CHECK (unit_price >= 0),
    currency    currency_code  NOT NULL,
    created_at  timestamptz    NOT NULL DEFAULT now(),
    updated_at  timestamptz    NOT NULL DEFAULT now(),
    CONSTRAINT uq_supplier_products UNIQUE (supplier_id, product_id)
);

COMMENT ON TABLE supplier_products IS 'Products a supplier carries with their current unit price. unit_price is a live catalogue price; order_items snapshots the price at order time.';

CREATE INDEX idx_supplier_products_supplier_id ON supplier_products (supplier_id);
CREATE INDEX idx_supplier_products_product_id  ON supplier_products (product_id);

CREATE TRIGGER trg_set_updated_at_supplier_products
    BEFORE UPDATE ON supplier_products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: inventory_items
-- Source of truth for current stock per shop per product.
-- UNIQUE(shop_id, product_id).
-- quantity_on_hand must NEVER be updated directly from application code.
-- All changes flow through stock_movements INSERT → trigger.
-- Note: no updated_at trigger here — updated_at is set by fn_apply_stock_movement().
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_items (
    id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id          uuid           NOT NULL REFERENCES shops(id)    ON DELETE CASCADE,
    product_id       uuid           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_on_hand numeric(12,3)  NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    min_quantity     numeric(12,3)  NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    created_at       timestamptz    NOT NULL DEFAULT now(),
    updated_at       timestamptz    NOT NULL DEFAULT now(),
    CONSTRAINT uq_inventory_items_shop_product UNIQUE (shop_id, product_id)
);

COMMENT ON TABLE inventory_items IS 'Source of truth for current stock per shop per product. quantity_on_hand is ONLY updated by trigger trg_stock_movement_apply — never directly from application code. updated_at is set by that same trigger.';

CREATE INDEX idx_inventory_items_shop_id    ON inventory_items (shop_id);
CREATE INDEX idx_inventory_items_product_id ON inventory_items (product_id);

-- ---------------------------------------------------------------------------
-- TABLE: stock_movements
-- Append-only audit trail of every change to inventory_items.quantity_on_hand.
-- After every INSERT the trigger updates inventory_items.quantity_on_hand.
-- No UPDATE or DELETE policies are defined on this table.
-- ---------------------------------------------------------------------------
CREATE TABLE stock_movements (
    id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id uuid           NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    shop_id           uuid           NOT NULL REFERENCES shops(id)            ON DELETE RESTRICT,
    product_id        uuid           NOT NULL REFERENCES products(id)         ON DELETE RESTRICT,
    movement_type     movement_type  NOT NULL,
    quantity          numeric(12,3)  NOT NULL CHECK (quantity > 0),
    reference_id      uuid,
    reference_type    text           CHECK (reference_type IN ('order', 'delivery', 'manual')),
    note              text,
    created_by        uuid           NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at        timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE stock_movements IS 'Append-only audit trail of every change to inventory_items.quantity_on_hand. No UPDATE or DELETE is permitted. quantity is always positive; direction is encoded in movement_type.';

CREATE INDEX idx_stock_movements_inventory_item_id ON stock_movements (inventory_item_id);
CREATE INDEX idx_stock_movements_shop_id           ON stock_movements (shop_id);
CREATE INDEX idx_stock_movements_product_id        ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_reference_id      ON stock_movements (reference_id);

-- ---------------------------------------------------------------------------
-- FUNCTION: fn_apply_stock_movement
-- AFTER INSERT on stock_movements:
--   Determines delta from movement_type (positive or negative).
--   Updates inventory_items.quantity_on_hand and updated_at.
--   Raises EXCEPTION 'insufficient_stock' if result would be < 0.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_delta        numeric(12,3);
    v_new_quantity numeric(12,3);
BEGIN
    -- Determine delta direction based on movement_type.
    IF NEW.movement_type IN ('purchase_in', 'adjustment_in', 'transfer_in') THEN
        v_delta := NEW.quantity;
    ELSIF NEW.movement_type IN ('sale_out', 'adjustment_out', 'damage', 'transfer_out') THEN
        v_delta := -NEW.quantity;
    ELSE
        RAISE EXCEPTION 'unknown movement_type: %', NEW.movement_type;
    END IF;

    -- Apply delta and capture new quantity in a single UPDATE ... RETURNING.
    UPDATE inventory_items
    SET
        quantity_on_hand = quantity_on_hand + v_delta,
        updated_at       = now()
    WHERE id = NEW.inventory_item_id
    RETURNING quantity_on_hand INTO v_new_quantity;

    -- Guard: quantity_on_hand must never go below 0.
    -- The CHECK constraint on the column is also present, but we raise a named
    -- exception here so application code can distinguish insufficient_stock
    -- from other constraint violations.
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'insufficient_stock'
            USING DETAIL = format(
                'inventory_item_id=%s would reach %s after applying %s of quantity %s',
                NEW.inventory_item_id, v_new_quantity, NEW.movement_type, NEW.quantity
            );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stock_movement_apply
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION fn_apply_stock_movement();

-- ---------------------------------------------------------------------------
-- TABLE: orders
-- A shop places an order to a supplier.
-- Status flows one direction only (enforced at application layer).
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id      uuid           NOT NULL REFERENCES shops(id)     ON DELETE RESTRICT,
    supplier_id  uuid           NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status       order_status   NOT NULL DEFAULT 'draft',
    total_amount numeric(14,2)  NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency     currency_code  NOT NULL,
    notes        text,
    created_by   uuid           NOT NULL REFERENCES profiles(id)  ON DELETE RESTRICT,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'A shop places an order to a supplier. Valid status transitions: draft→submitted→confirmed→shipped→delivered; draft/submitted→cancelled.';

CREATE INDEX idx_orders_shop_id     ON orders (shop_id);
CREATE INDEX idx_orders_supplier_id ON orders (supplier_id);
CREATE INDEX idx_orders_status      ON orders (status);

CREATE TRIGGER trg_set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: order_items
-- Line items within an order. unit_price is a price snapshot at order time.
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   uuid           NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id uuid           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity   numeric(12,3)  NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2)  NOT NULL CHECK (unit_price >= 0),
    currency   currency_code  NOT NULL
);

COMMENT ON TABLE order_items IS 'Line items within an order. unit_price is a snapshot of the price at time of order and does not change if supplier_products.unit_price changes later.';

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- ---------------------------------------------------------------------------
-- TABLE: deliveries
-- One delivery per order (MVP). UNIQUE(order_id).
-- Created when order transitions to shipped.
-- ---------------------------------------------------------------------------
CREATE TABLE deliveries (
    id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       uuid             NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    operator_id    uuid             REFERENCES profiles(id) ON DELETE SET NULL,
    status         delivery_status  NOT NULL DEFAULT 'pending',
    scheduled_date date,
    delivered_at   timestamptz,
    notes          text,
    created_at     timestamptz      NOT NULL DEFAULT now(),
    updated_at     timestamptz      NOT NULL DEFAULT now()
);

COMMENT ON TABLE deliveries IS 'One delivery record per order (MVP). Created when the order transitions to shipped. UNIQUE(order_id) enforced.';

CREATE INDEX idx_deliveries_order_id    ON deliveries (order_id);
CREATE INDEX idx_deliveries_operator_id ON deliveries (operator_id);
CREATE INDEX idx_deliveries_status      ON deliveries (status);

CREATE TRIGGER trg_set_updated_at_deliveries
    BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: payments
-- Manual payment record linked to an order. One payment per order (MVP).
-- UNIQUE(order_id). shop_id is denormalized for query performance.
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id               uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         uuid            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    shop_id          uuid            NOT NULL REFERENCES shops(id)         ON DELETE RESTRICT,
    amount           numeric(14,2)   NOT NULL CHECK (amount > 0),
    currency         currency_code   NOT NULL,
    payment_method   payment_method  NOT NULL,
    status           payment_status  NOT NULL DEFAULT 'pending',
    reference_number text,
    paid_at          timestamptz,
    created_at       timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE payments IS 'Manual payment record linked to one order (MVP). shop_id is denormalized for query performance. UNIQUE(order_id) enforced.';

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_shop_id  ON payments (shop_id);
CREATE INDEX idx_payments_status   ON payments (status);

-- ---------------------------------------------------------------------------
-- TABLE: activity_feed
-- Append-only event log. No UPDATE or DELETE is permitted.
-- shop_id is nullable for platform-level events.
-- ---------------------------------------------------------------------------
CREATE TABLE activity_feed (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    shop_id     uuid        REFERENCES shops(id) ON DELETE SET NULL,
    action      text        NOT NULL,
    entity_type text        NOT NULL,
    entity_id   uuid        NOT NULL,
    meta        jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_feed IS 'Append-only event log of all significant actions. shop_id is nullable for platform-level events. No UPDATE or DELETE RLS policies exist on this table.';

CREATE INDEX idx_activity_feed_actor_id   ON activity_feed (actor_id);
CREATE INDEX idx_activity_feed_shop_id    ON activity_feed (shop_id);
CREATE INDEX idx_activity_feed_entity_id  ON activity_feed (entity_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed (created_at DESC);

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS (used in RLS policies)
-- ---------------------------------------------------------------------------

-- fn_current_role(): returns the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION fn_current_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- fn_current_shop_id(): returns the shop_id for the authenticated user.
-- Checks shops.owner_id first (active shops only), then shop_staff.shop_id.
CREATE OR REPLACE FUNCTION fn_current_shop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM shops WHERE owner_id = auth.uid() AND is_active = true
    UNION ALL
    SELECT shop_id FROM shop_staff WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_staff         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed      ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- RLS: organizations
-- SELECT: member of the org or platform_admin.
-- INSERT/UPDATE/DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "organizations_select"
    ON organizations FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR owner_id = auth.uid()
        OR id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "organizations_insert"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "organizations_update"
    ON organizations FOR UPDATE
    TO authenticated
    USING  (fn_current_role() = 'platform_admin')
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "organizations_delete"
    ON organizations FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: profiles
-- SELECT: own row, OR platform_admin, OR shop_owner seeing their shop's staff.
-- INSERT: auth.uid() = id (signup only).
-- UPDATE: own row OR platform_admin.
-- ===========================================================================
CREATE POLICY "profiles_select"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR fn_current_role() = 'platform_admin'
        OR id IN (
            SELECT ss.user_id
            FROM shop_staff ss
            INNER JOIN shops s ON s.id = ss.shop_id
            WHERE s.owner_id = auth.uid()
        )
    );

CREATE POLICY "profiles_insert"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
    ON profiles FOR UPDATE
    TO authenticated
    USING  (id = auth.uid() OR fn_current_role() = 'platform_admin')
    WITH CHECK (id = auth.uid() OR fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: shops
-- SELECT: owner, staff, or platform_admin.
-- INSERT/UPDATE/DELETE: owner or platform_admin.
-- ===========================================================================
CREATE POLICY "shops_select"
    ON shops FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR owner_id = auth.uid()
        OR id IN (
            SELECT shop_id FROM shop_staff WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "shops_insert"
    ON shops FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_id = auth.uid()
        OR fn_current_role() = 'platform_admin'
    );

CREATE POLICY "shops_update"
    ON shops FOR UPDATE
    TO authenticated
    USING  (owner_id = auth.uid() OR fn_current_role() = 'platform_admin')
    WITH CHECK (owner_id = auth.uid() OR fn_current_role() = 'platform_admin');

CREATE POLICY "shops_delete"
    ON shops FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid() OR fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: shop_staff
-- SELECT: the staff user themselves, shop owner, or platform_admin.
-- INSERT/DELETE: shop owner of that shop or platform_admin.
-- ===========================================================================
CREATE POLICY "shop_staff_select"
    ON shop_staff FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR user_id = auth.uid()
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "shop_staff_insert"
    ON shop_staff FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "shop_staff_delete"
    ON shop_staff FOR DELETE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- ===========================================================================
-- RLS: product_categories
-- SELECT: all authenticated users.
-- INSERT/UPDATE/DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "product_categories_select"
    ON product_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "product_categories_insert"
    ON product_categories FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "product_categories_update"
    ON product_categories FOR UPDATE
    TO authenticated
    USING  (fn_current_role() = 'platform_admin')
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "product_categories_delete"
    ON product_categories FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: products
-- SELECT: all authenticated users.
-- INSERT/UPDATE/DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "products_select"
    ON products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "products_insert"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "products_update"
    ON products FOR UPDATE
    TO authenticated
    USING  (fn_current_role() = 'platform_admin')
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "products_delete"
    ON products FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: suppliers
-- SELECT: all authenticated users.
-- UPDATE: own record (user_id = auth.uid()) or platform_admin.
-- INSERT/DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "suppliers_select"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "suppliers_insert"
    ON suppliers FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "suppliers_update"
    ON suppliers FOR UPDATE
    TO authenticated
    USING  (user_id = auth.uid() OR fn_current_role() = 'platform_admin')
    WITH CHECK (user_id = auth.uid() OR fn_current_role() = 'platform_admin');

CREATE POLICY "suppliers_delete"
    ON suppliers FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: supplier_products
-- SELECT: all authenticated users.
-- INSERT/UPDATE/DELETE: supplier whose user_id = auth.uid() (for their own
--   supplier_id) OR platform_admin.
-- ===========================================================================
CREATE POLICY "supplier_products_select"
    ON supplier_products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "supplier_products_insert"
    ON supplier_products FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "supplier_products_update"
    ON supplier_products FOR UPDATE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "supplier_products_delete"
    ON supplier_products FOR DELETE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
    );

-- ===========================================================================
-- RLS: inventory_items
-- SELECT: own shop (owner or staff) or platform_admin.
-- INSERT: shop owner or platform_admin.
-- UPDATE: shop owner, shop staff, or platform_admin.
--   (Direct update of quantity_on_hand is blocked at app level, not DB level —
--    quantity_on_hand is updated only by the trigger.)
-- DELETE: platform_admin only (soft-delete preferred).
-- ===========================================================================
CREATE POLICY "inventory_items_select"
    ON inventory_items FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    );

CREATE POLICY "inventory_items_insert"
    ON inventory_items FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "inventory_items_update"
    ON inventory_items FOR UPDATE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    )
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    );

CREATE POLICY "inventory_items_delete"
    ON inventory_items FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: stock_movements
-- Append-only. No UPDATE or DELETE policies.
-- SELECT/INSERT: own shop or platform_admin.
-- ===========================================================================
CREATE POLICY "stock_movements_select"
    ON stock_movements FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    );

CREATE POLICY "stock_movements_insert"
    ON stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    );

-- ===========================================================================
-- RLS: orders
-- SELECT: own shop (owner or staff), OR supplier for their orders,
--         OR delivery_operator for orders linked to their delivery,
--         OR platform_admin.
-- INSERT: shop owner or staff, or platform_admin.
-- UPDATE: shop owner or platform_admin.
-- DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "orders_select"
    ON orders FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
        OR supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
        OR id IN (
            SELECT order_id FROM deliveries WHERE operator_id = auth.uid()
        )
    );

CREATE POLICY "orders_insert"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
    );

CREATE POLICY "orders_update"
    ON orders FOR UPDATE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "orders_delete"
    ON orders FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: order_items
-- SELECT/INSERT: scoped to own shop or platform_admin. No DELETE policy.
-- ===========================================================================
CREATE POLICY "order_items_select"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR order_id IN (
            SELECT id FROM orders
            WHERE shop_id = fn_current_shop_id()
               OR supplier_id IN (
                   SELECT id FROM suppliers WHERE user_id = auth.uid()
               )
        )
    );

CREATE POLICY "order_items_insert"
    ON order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR order_id IN (
            SELECT id FROM orders WHERE shop_id = fn_current_shop_id()
        )
    );

-- ===========================================================================
-- RLS: deliveries
-- SELECT: own shop (owner or staff), OR delivery_operator where
--         operator_id = auth.uid(), OR platform_admin.
-- INSERT: platform_admin only (created when order → shipped).
-- UPDATE: delivery_operator (status, delivered_at, notes) OR platform_admin.
-- ===========================================================================
CREATE POLICY "deliveries_select"
    ON deliveries FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR operator_id = auth.uid()
        OR order_id IN (
            SELECT id FROM orders WHERE shop_id = fn_current_shop_id()
        )
    );

CREATE POLICY "deliveries_insert"
    ON deliveries FOR INSERT
    TO authenticated
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "deliveries_update"
    ON deliveries FOR UPDATE
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR operator_id = auth.uid()
    )
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR operator_id = auth.uid()
    );

-- ===========================================================================
-- RLS: payments
-- SELECT: own shop (owner or staff), OR supplier for their orders,
--         OR platform_admin.
-- INSERT: shop owner or platform_admin.
-- UPDATE/DELETE: platform_admin only.
-- ===========================================================================
CREATE POLICY "payments_select"
    ON payments FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR shop_id = fn_current_shop_id()
        OR order_id IN (
            SELECT o.id FROM orders o
            INNER JOIN suppliers s ON s.id = o.supplier_id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_insert"
    ON payments FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_current_role() = 'platform_admin'
        OR shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "payments_update"
    ON payments FOR UPDATE
    TO authenticated
    USING  (fn_current_role() = 'platform_admin')
    WITH CHECK (fn_current_role() = 'platform_admin');

CREATE POLICY "payments_delete"
    ON payments FOR DELETE
    TO authenticated
    USING (fn_current_role() = 'platform_admin');

-- ===========================================================================
-- RLS: activity_feed
-- Append-only. No UPDATE or DELETE policies.
-- SELECT: own actions (actor_id = auth.uid()), OR own shop, OR platform_admin.
-- INSERT: any authenticated user (actor_id must equal auth.uid()).
-- ===========================================================================
CREATE POLICY "activity_feed_select"
    ON activity_feed FOR SELECT
    TO authenticated
    USING (
        fn_current_role() = 'platform_admin'
        OR actor_id = auth.uid()
        OR shop_id = fn_current_shop_id()
    );

CREATE POLICY "activity_feed_insert"
    ON activity_feed FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());

COMMIT;
