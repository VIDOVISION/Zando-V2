# Zando V2 — Seed Data Reference

**File:** `supabase/seed.sql`

This document describes the development seed data bundled with the project. The seed is for local development and demos only. It must never be run against a production database.

---

## What is seeded

| Entity | Count | Details |
|---|---|---|
| Organizations | 1 | Zando Demo |
| Profiles | 1 | Patron Demo (shop_owner, no auth.users entry) |
| Shops | 1 | Boutique Demo Kinshasa |
| Product categories | 4 | Boissons, Eau, Bières, Jus |
| Products | 9 | Congolese market beverages (see table below) |
| Inventory items | 9 | All linked to the demo shop |
| Stock movements | 9 | Opening stock, movement_type = purchase_in |

The seed does not include orders, order_items, deliveries, payments, suppliers, supplier_products, or shop_staff.

---

## How to run

### Option A — Supabase CLI (recommended)

```bash
supabase db reset
```

This command drops and recreates the local database, applies all migrations in order, and then runs `supabase/seed.sql` automatically.

### Option B — Supabase SQL Editor

Paste the full contents of `supabase/seed.sql` into the SQL Editor and click Run. This is safe to run multiple times (see idempotency note below).

---

## Idempotency

The seed is safe to run more than once:

- **organizations, profiles, shops** — `ON CONFLICT (id) DO NOTHING`
- **product_categories** — `ON CONFLICT (slug) DO NOTHING`
- **products** — `ON CONFLICT (slug) DO NOTHING`
- **inventory_items** — `ON CONFLICT (shop_id, product_id) DO NOTHING`
- **stock_movements** — no unique constraint exists, so each insert is guarded by an explicit check: the movement is only inserted if `inventory_items.quantity_on_hand = 0`. This prevents opening-stock movements from being duplicated on re-runs.

---

## Demo UUIDs

These values are fixed and deterministic. Use them in tests, Postman collections, or manual SQL queries.

| Variable | UUID | Description |
|---|---|---|
| demo_org_id | `10000000-0000-0000-0000-000000000001` | Organization: Zando Demo |
| demo_profile_id | `10000000-0000-0000-0000-000000000002` | Profile: Patron Demo |
| demo_shop_id | `10000000-0000-0000-0000-000000000003` | Shop: Boutique Demo Kinshasa |
| cat_boissons | `10000000-0000-0000-0000-000000000010` | Category: Boissons |
| cat_eau | `10000000-0000-0000-0000-000000000011` | Category: Eau |
| cat_bieres | `10000000-0000-0000-0000-000000000012` | Category: Bières |
| cat_jus | `10000000-0000-0000-0000-000000000013` | Category: Jus |
| prod_fanta | `10000000-0000-0000-0000-000000000020` | Product: Fanta Orange 50cl |
| prod_vitalo | `10000000-0000-0000-0000-000000000021` | Product: Vitalo 50cl |
| prod_nkoyi_b | `10000000-0000-0000-0000-000000000022` | Product: Nkoyi Blonde |
| prod_nkoyi_bl | `10000000-0000-0000-0000-000000000023` | Product: Nkoyi Black |
| prod_beaufort | `10000000-0000-0000-0000-000000000024` | Product: Beaufort |
| prod_heineken | `10000000-0000-0000-0000-000000000025` | Product: Heineken |
| prod_castel | `10000000-0000-0000-0000-000000000026` | Product: Castel |
| prod_tembo | `10000000-0000-0000-0000-000000000027` | Product: Tembo |
| prod_eau_vive | `10000000-0000-0000-0000-000000000028` | Product: Eau Vive 50cl |
| inv_fanta | `10000000-0000-0000-0000-000000000030` | Inventory item: Fanta in demo shop |
| inv_vitalo | `10000000-0000-0000-0000-000000000031` | Inventory item: Vitalo in demo shop |
| inv_nkoyi_b | `10000000-0000-0000-0000-000000000032` | Inventory item: Nkoyi Blonde in demo shop |
| inv_nkoyi_bl | `10000000-0000-0000-0000-000000000033` | Inventory item: Nkoyi Black in demo shop |
| inv_beaufort | `10000000-0000-0000-0000-000000000034` | Inventory item: Beaufort in demo shop |
| inv_heineken | `10000000-0000-0000-0000-000000000035` | Inventory item: Heineken in demo shop |
| inv_castel | `10000000-0000-0000-0000-000000000036` | Inventory item: Castel in demo shop |
| inv_tembo | `10000000-0000-0000-0000-000000000037` | Inventory item: Tembo in demo shop |
| inv_eau_vive | `10000000-0000-0000-0000-000000000038` | Inventory item: Eau Vive in demo shop |

---

## Products seeded

| Name | SKU | Category | Unit | Selling price (CDF) | Opening stock |
|---|---|---|---|---|---|
| Fanta Orange 50cl | FAO50 | Jus | bouteille | 850 | 48 |
| Vitalo 50cl | VIT50 | Jus | bouteille | 750 | 24 |
| Nkoyi Blonde | NKB33 | Bières | bouteille | 2 200 | 96 |
| Nkoyi Black | NKBL33 | Bières | bouteille | 2 200 | 48 |
| Beaufort | BEA65 | Bières | bouteille | 2 500 | 60 |
| Heineken | HEI33 | Bières | bouteille | 3 500 | 48 |
| Castel | CAS65 | Bières | bouteille | 2 000 | 72 |
| Tembo | TEM65 | Bières | bouteille | 2 000 | 36 |
| Eau Vive 50cl | EAV50 | Eau | bouteille | 500 | 120 |

---

## Note on authentication

The demo profile (`id = 10000000-0000-0000-0000-000000000002`, full_name = 'Patron Demo') has **no corresponding row in `auth.users`**. It was inserted directly into the `profiles` table to satisfy the foreign-key constraints on `shops.owner_id` and `stock_movements.created_by`. It cannot be used to log in.

The trigger `trg_create_profile_on_signup` is not involved here — it fires on `auth.users` INSERT and is only relevant when real users sign up through the Supabase Auth flow.

---

## What comes next — adding a real user

To test the application end-to-end with the seed data, you need a real authenticated user linked to the demo shop.

1. **Create a user** in the Supabase Auth dashboard (Authentication > Users > Add user), or sign up through the app UI.
2. **Promote the role** in the SQL Editor if you want platform-admin access:
   ```sql
   UPDATE profiles SET role = 'platform_admin' WHERE id = '<your-auth-uid>';
   ```
3. **Link to the demo shop** if you want shop_owner access to the seeded data:
   ```sql
   -- Reassign the demo shop to your real user
   UPDATE shops SET owner_id = '<your-auth-uid>' WHERE id = '10000000-0000-0000-0000-000000000003';
   -- Update the demo profile org link if needed
   UPDATE profiles SET organization_id = '10000000-0000-0000-0000-000000000001' WHERE id = '<your-auth-uid>';
   ```
4. The seeded inventory and stock movements will then be visible to your authenticated session through the existing RLS policies.

---

## Migration 0004 — Dev Preview Policies

`supabase/migrations/0004_dev_preview_read_policies.sql` adds anonymous (`anon` role) SELECT policies so that `/products` and `/stock` can show seeded data in dev preview mode (`ZANDO_DEV_PREVIEW=true`) without a Supabase session.

**Apply to:** local development database only.
**Do not apply to:** staging or production.

Migrations 0001–0003 are safe for all environments. Migrations 0004–0005 are intentionally excluded from production apply lists.

---

## Migration 0005 — Dev Preview Anon Grants

`supabase/migrations/0005_dev_preview_anon_grants.sql` grants `SELECT` to the `anon` role on the six tables used by dev preview reads.

**Why this is needed in addition to 0004:** Postgres has two separate access layers. RLS policies (migration 0004) control *which rows* a role sees. Table-level `GRANT SELECT` controls *whether the role can touch the table at all*. Without this grant, Postgres raises `42501 permission denied for table` before RLS is even evaluated.

**Apply to:** local development database only.
**Do not apply to:** staging or production.

In production, `SELECT` grants to `anon` are unnecessary (all production queries use `TO authenticated` policies) and would expose table access to unauthenticated API requests.
