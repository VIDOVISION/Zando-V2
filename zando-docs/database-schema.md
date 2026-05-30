# Zando V2 — Database Schema

**Source of truth.** The SQL definition lives in `supabase/migrations/0001_zando_v2_core_schema.sql`.
Any change to a table, column, enum, trigger, or function must update both the migration and this document.

All tables live in Supabase (PostgreSQL 15+). Row-Level Security (RLS) enforces role isolation at the database layer. Application code must never bypass RLS by using the service role key on the client. All timestamps are stored UTC.

---

## Enums

```sql
user_role:       platform_admin | shop_owner | shop_staff | supplier | delivery_operator
movement_type:   purchase_in | sale_out | adjustment_in | adjustment_out | damage | transfer_in | transfer_out
order_status:    draft | submitted | confirmed | shipped | delivered | cancelled
delivery_status: pending | in_transit | delivered | failed
payment_method:  cash | mobile_money | bank_transfer
payment_status:  pending | completed | failed
currency_code:   CDF | USD
```

`adjustment_in` and `adjustment_out` are separate enum values so that `stock_movements.quantity` is **always positive**. Direction is encoded in the type, never the sign.

---

## organizations

Top-level business entity that groups one or more shops and suppliers under a single owner.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text NOT NULL | |
| owner_id | uuid FK → profiles.id | nullable; SET NULL on delete; deferred FK added after profiles |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_organizations |

---

## profiles

Extends `auth.users`. One row per authenticated user. `id` = `auth.uid()`. Never reference `auth.users` directly from application tables.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | = auth.uid() |
| organization_id | uuid FK → organizations.id | nullable; SET NULL on delete |
| full_name | text NOT NULL | |
| phone | text | |
| role | user_role NOT NULL | DEFAULT 'shop_owner' |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_profiles |

Auto-created via trigger `trg_create_profile_on_signup` on `auth.users` AFTER INSERT. Default role is `shop_owner`; update as needed.

---

## shops

A single retail location. `is_active = false` is the soft-delete pattern.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| organization_id | uuid FK → organizations.id | nullable; SET NULL on delete |
| owner_id | uuid FK → profiles.id NOT NULL | RESTRICT delete |
| name | text NOT NULL | |
| phone | text | |
| address | text | |
| city | text | |
| is_active | boolean NOT NULL | DEFAULT true |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_shops |

**Indexes:** `idx_shops_owner_id`, `idx_shops_organization_id`

---

## shop_staff

Links a `shop_staff` profile to exactly one shop. `UNIQUE (user_id)` enforces one-shop-per-staff in MVP.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| shop_id | uuid FK → shops.id NOT NULL | CASCADE delete |
| user_id | uuid FK → profiles.id NOT NULL | CASCADE delete; UNIQUE via uq_shop_staff_user |
| created_at | timestamptz NOT NULL | DEFAULT now() |

**Indexes:** `idx_shop_staff_shop_id`

---

## product_categories

Flat taxonomy for the global product catalog (e.g. alimentation, boissons, hygiene). Managed by platform_admin only.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text NOT NULL | |
| slug | text NOT NULL | UNIQUE via uq_product_categories_slug |
| created_at | timestamptz NOT NULL | DEFAULT now() |

---

## products

Global product catalog shared across all shops. Managed exclusively by `platform_admin`.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| category_id | uuid FK → product_categories.id | nullable; SET NULL on delete |
| name | text NOT NULL | |
| slug | text NOT NULL | UNIQUE via uq_products_slug |
| description | text | |
| unit | text NOT NULL | DEFAULT 'piece' — e.g. piece, kg, litre, carton, sac |
| image_url | text | |
| sku | text | nullable; UNIQUE when set (partial index `idx_products_sku`) |
| is_active | boolean NOT NULL | DEFAULT true — soft-delete flag |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_products |

**Indexes:** `idx_products_category_id`, `idx_products_sku` (partial unique, WHERE sku IS NOT NULL)

---

## suppliers

A business that sells products to shops. `user_id` is nullable (supplier may not have a Zando account yet). `is_active = false` is the soft-delete pattern.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| organization_id | uuid FK → organizations.id | nullable; SET NULL on delete |
| user_id | uuid FK → profiles.id | nullable; SET NULL on delete |
| name | text NOT NULL | |
| contact_name | text | |
| phone | text | |
| email | text | |
| address | text | |
| city | text | |
| is_active | boolean NOT NULL | DEFAULT true |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_suppliers |

**Indexes:** `idx_suppliers_user_id`

---

## supplier_products

Products a supplier carries with their current unit price. `UNIQUE (supplier_id, product_id)` via `uq_supplier_products`.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| supplier_id | uuid FK → suppliers.id NOT NULL | CASCADE delete |
| product_id | uuid FK → products.id NOT NULL | CASCADE delete |
| unit_price | numeric(12,2) NOT NULL | CHECK >= 0 |
| currency | currency_code NOT NULL | |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_supplier_products |

**Indexes:** `idx_supplier_products_supplier_id`, `idx_supplier_products_product_id`

---

## inventory_items

**Source of truth for current stock per shop per product.**

One row per `(shop_id, product_id)` pair. `UNIQUE (shop_id, product_id)` enforced via `uq_inventory_items_shop_product`.

> **Rule:** Never `UPDATE quantity_on_hand` directly from application code. All changes must flow through a `stock_movements` INSERT → trigger `trg_stock_movement_apply`. `updated_at` is also set exclusively by that trigger.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| shop_id | uuid FK → shops.id NOT NULL | CASCADE delete |
| product_id | uuid FK → products.id NOT NULL | RESTRICT delete |
| quantity_on_hand | numeric(12,3) NOT NULL | DEFAULT 0; CHECK >= 0 |
| min_quantity | numeric(12,3) NOT NULL | DEFAULT 0; CHECK >= 0 |
| selling_price | numeric(12,2) | nullable — shop-specific retail price charged to customers |
| currency | currency_code | nullable — DEFAULT 'CDF'; pricing currency for selling_price |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by fn_apply_stock_movement (not a BEFORE UPDATE trigger) |

**Indexes:** `idx_inventory_items_shop_id`, `idx_inventory_items_product_id`

---

## stock_movements

**Append-only audit trail** of every change to `inventory_items.quantity_on_hand`.

After every INSERT, trigger `trg_stock_movement_apply` fires `fn_apply_stock_movement()` which updates `inventory_items.quantity_on_hand`. If the result would be negative, the trigger raises exception `insufficient_stock` and the INSERT is rolled back.

No `UPDATE` or `DELETE` RLS policies exist on this table.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| inventory_item_id | uuid FK → inventory_items.id NOT NULL | RESTRICT delete |
| shop_id | uuid FK → shops.id NOT NULL | RESTRICT delete; denormalized for query performance |
| product_id | uuid FK → products.id NOT NULL | RESTRICT delete; denormalized |
| movement_type | movement_type NOT NULL | |
| quantity | numeric(12,3) NOT NULL | CHECK > 0; always positive |
| reference_id | uuid | nullable; links to orders.id or deliveries.id |
| reference_type | text | nullable; CHECK IN ('order', 'delivery', 'manual') |
| note | text | |
| created_by | uuid FK → profiles.id NOT NULL | RESTRICT delete |
| created_at | timestamptz NOT NULL | DEFAULT now() |

**Indexes:** `idx_stock_movements_inventory_item_id`, `idx_stock_movements_shop_id`, `idx_stock_movements_product_id`, `idx_stock_movements_reference_id`

---

## orders

A shop places an order to a supplier. Status flows one direction only (enforced at application layer).

```
draft → submitted → confirmed → shipped → delivered
draft → cancelled
submitted → cancelled
```

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| shop_id | uuid FK → shops.id NOT NULL | RESTRICT delete |
| supplier_id | uuid FK → suppliers.id NOT NULL | RESTRICT delete |
| status | order_status NOT NULL | DEFAULT 'draft' |
| total_amount | numeric(14,2) NOT NULL | DEFAULT 0; CHECK >= 0 |
| currency | currency_code NOT NULL | |
| notes | text | |
| created_by | uuid FK → profiles.id NOT NULL | RESTRICT delete |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_orders |

**Indexes:** `idx_orders_shop_id`, `idx_orders_supplier_id`, `idx_orders_status`

---

## order_items

Line items within an order. `unit_price` is a snapshot of the price at time of order; it does not change if `supplier_products.unit_price` changes later.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| order_id | uuid FK → orders.id NOT NULL | CASCADE delete |
| product_id | uuid FK → products.id NOT NULL | RESTRICT delete |
| quantity | numeric(12,3) NOT NULL | CHECK > 0 |
| unit_price | numeric(12,2) NOT NULL | CHECK >= 0 |
| currency | currency_code NOT NULL | |

**Indexes:** `idx_order_items_order_id`, `idx_order_items_product_id`

---

## deliveries

One delivery per order (MVP). `UNIQUE (order_id)`. Created when order transitions to `shipped`.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| order_id | uuid FK → orders.id NOT NULL UNIQUE | RESTRICT delete |
| operator_id | uuid FK → profiles.id | nullable; SET NULL on delete |
| status | delivery_status NOT NULL | DEFAULT 'pending' |
| scheduled_date | date | |
| delivered_at | timestamptz | nullable |
| notes | text | |
| created_at | timestamptz NOT NULL | DEFAULT now() |
| updated_at | timestamptz NOT NULL | DEFAULT now(); set by trg_set_updated_at_deliveries |

**Indexes:** `idx_deliveries_order_id`, `idx_deliveries_operator_id`, `idx_deliveries_status`

---

## payments

Manual payment records linked to an order. One payment per order (MVP). `UNIQUE (order_id)`. `shop_id` is denormalized for query performance.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| order_id | uuid FK → orders.id NOT NULL UNIQUE | RESTRICT delete |
| shop_id | uuid FK → shops.id NOT NULL | RESTRICT delete; denormalized |
| amount | numeric(14,2) NOT NULL | CHECK > 0 |
| currency | currency_code NOT NULL | |
| payment_method | payment_method NOT NULL | |
| status | payment_status NOT NULL | DEFAULT 'pending' |
| reference_number | text | nullable |
| paid_at | timestamptz | nullable |
| created_at | timestamptz NOT NULL | DEFAULT now() |

**Indexes:** `idx_payments_order_id`, `idx_payments_shop_id`, `idx_payments_status`

---

## activity_feed

Append-only log of all significant actions. `shop_id` is nullable for platform-level events.

No `UPDATE` or `DELETE` RLS policies exist on this table.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid PK | DEFAULT gen_random_uuid() |
| actor_id | uuid FK → profiles.id NOT NULL | RESTRICT delete |
| shop_id | uuid FK → shops.id | nullable; SET NULL on delete |
| action | text NOT NULL | e.g. 'order.created', 'stock.adjusted' |
| entity_type | text NOT NULL | e.g. 'order', 'inventory_item' |
| entity_id | uuid NOT NULL | |
| meta | jsonb | snapshot of relevant fields at time of action |
| created_at | timestamptz NOT NULL | DEFAULT now() |

**Indexes:** `idx_activity_feed_actor_id`, `idx_activity_feed_shop_id`, `idx_activity_feed_entity_id`, `idx_activity_feed_created_at` (DESC)

---

## Triggers

| Trigger name | Table | Event | Function |
|---|---|---|---|
| trg_set_updated_at_organizations | organizations | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_profiles | profiles | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_shops | shops | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_products | products | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_suppliers | suppliers | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_supplier_products | supplier_products | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_orders | orders | BEFORE UPDATE | fn_set_updated_at() |
| trg_set_updated_at_deliveries | deliveries | BEFORE UPDATE | fn_set_updated_at() |
| trg_stock_movement_apply | stock_movements | AFTER INSERT | fn_apply_stock_movement() |
| trg_create_profile_on_signup | auth.users | AFTER INSERT | fn_create_profile_on_signup() |

Note: `inventory_items` has **no** BEFORE UPDATE trigger. Its `updated_at` is set directly inside `fn_apply_stock_movement()` to keep it in sync with the stock change atomically.

---

## Functions

### fn_set_updated_at()

`RETURNS TRIGGER LANGUAGE plpgsql`

Sets `NEW.updated_at = now()` and returns `NEW`. Used as a BEFORE UPDATE trigger on all tables that have an `updated_at` column, except `inventory_items`.

---

### fn_create_profile_on_signup()

`RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`

Fires AFTER INSERT on `auth.users`. Inserts a row into `public.profiles` with:
- `id = NEW.id`
- `full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', '')`
- `role = 'shop_owner'`

Uses `ON CONFLICT (id) DO NOTHING` to be idempotent. Trigger name: `trg_create_profile_on_signup`.

---

### fn_apply_stock_movement()

`RETURNS TRIGGER LANGUAGE plpgsql`

Fires AFTER INSERT on `stock_movements`. Logic:

1. Determines delta:
   - `purchase_in`, `adjustment_in`, `transfer_in` → `+quantity`
   - `sale_out`, `adjustment_out`, `damage`, `transfer_out` → `-quantity`
   - Unknown type → `RAISE EXCEPTION`
2. `UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + delta, updated_at = now() WHERE id = NEW.inventory_item_id RETURNING quantity_on_hand`
3. If `quantity_on_hand < 0` after the update: `RAISE EXCEPTION 'insufficient_stock'`

Trigger name: `trg_stock_movement_apply`.

---

## Helper Functions (used in RLS policies)

| Function | Returns | Security | Purpose |
|---|---|---|---|
| fn_current_role() | user_role | SECURITY DEFINER, SET search_path = public | Role of the authenticated user |
| fn_current_shop_id() | uuid | SECURITY DEFINER, SET search_path = public | shop_id for the authenticated user (owner or staff) |

`fn_current_role()` — `SELECT role FROM profiles WHERE id = auth.uid()`

`fn_current_shop_id()` — returns first result of: shops where `owner_id = auth.uid() AND is_active = true`, UNION ALL shop_staff where `user_id = auth.uid()`, LIMIT 1.

Both are `LANGUAGE sql STABLE`.

---

## Row-Level Security Policies

RLS is enabled on all 15 tables. Policies use `fn_current_role()` and `fn_current_shop_id()` helper functions.

### organizations
| Operation | Allowed for |
|---|---|
| SELECT | platform_admin; rows where owner_id = auth.uid(); rows where organization_id matches caller's profile |
| INSERT | platform_admin only |
| UPDATE | platform_admin only |
| DELETE | platform_admin only |

### profiles
| Operation | Allowed for |
|---|---|
| SELECT | own row; platform_admin; shop_owner seeing their shop's staff profiles |
| INSERT | auth.uid() = id (signup only) |
| UPDATE | own row; platform_admin |

### shops
| Operation | Allowed for |
|---|---|
| SELECT | owner_id = auth.uid(); staff of the shop; platform_admin |
| INSERT | owner_id = auth.uid(); platform_admin |
| UPDATE | owner_id = auth.uid(); platform_admin |
| DELETE | owner_id = auth.uid(); platform_admin |

### shop_staff
| Operation | Allowed for |
|---|---|
| SELECT | the staff user themselves; shop owner; platform_admin |
| INSERT | shop owner of that shop; platform_admin |
| DELETE | shop owner of that shop; platform_admin |

### product_categories
| Operation | Allowed for |
|---|---|
| SELECT | all authenticated users |
| INSERT | platform_admin only |
| UPDATE | platform_admin only |
| DELETE | platform_admin only |

### products
| Operation | Allowed for |
|---|---|
| SELECT | all authenticated users |
| INSERT | platform_admin only |
| UPDATE | platform_admin only |
| DELETE | platform_admin only |

### suppliers
| Operation | Allowed for |
|---|---|
| SELECT | all authenticated users |
| INSERT | platform_admin only |
| UPDATE | user_id = auth.uid() (own record); platform_admin |
| DELETE | platform_admin only |

### supplier_products
| Operation | Allowed for |
|---|---|
| SELECT | all authenticated users |
| INSERT | supplier whose user_id = auth.uid() for their own supplier_id; platform_admin |
| UPDATE | supplier whose user_id = auth.uid() for their own supplier_id; platform_admin |
| DELETE | supplier whose user_id = auth.uid() for their own supplier_id; platform_admin |

### inventory_items
| Operation | Allowed for |
|---|---|
| SELECT | own shop (owner or staff); platform_admin |
| INSERT | shop owner; platform_admin |
| UPDATE | own shop (owner or staff); platform_admin |
| DELETE | platform_admin only |

Note: direct UPDATE of `quantity_on_hand` is blocked at the application layer, not the DB layer. The column is only written by the trigger.

### stock_movements
| Operation | Allowed for |
|---|---|
| SELECT | own shop; platform_admin |
| INSERT | own shop; platform_admin |
| UPDATE | no policy (append-only) |
| DELETE | no policy (append-only) |

### orders
| Operation | Allowed for |
|---|---|
| SELECT | own shop (owner or staff); supplier for their orders; delivery_operator for linked deliveries; platform_admin |
| INSERT | own shop (owner or staff); platform_admin |
| UPDATE | shop owner; platform_admin |
| DELETE | platform_admin only |

### order_items
| Operation | Allowed for |
|---|---|
| SELECT | own shop or supplier for those orders; platform_admin |
| INSERT | own shop; platform_admin |

### deliveries
| Operation | Allowed for |
|---|---|
| SELECT | own shop (owner or staff); operator_id = auth.uid(); platform_admin |
| INSERT | platform_admin only |
| UPDATE | operator_id = auth.uid(); platform_admin |

### payments
| Operation | Allowed for |
|---|---|
| SELECT | own shop (owner or staff); supplier for their orders; platform_admin |
| INSERT | shop owner; platform_admin |
| UPDATE | platform_admin only |
| DELETE | platform_admin only |

### activity_feed
| Operation | Allowed for |
|---|---|
| SELECT | actor_id = auth.uid(); own shop; platform_admin |
| INSERT | any authenticated user (actor_id must equal auth.uid()) |
| UPDATE | no policy (append-only) |
| DELETE | no policy (append-only) |
