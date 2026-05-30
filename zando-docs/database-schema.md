# Zando V2 — Database Schema

All tables live in Supabase (PostgreSQL). Row-level security (RLS) enforces role isolation at the database level.

---

## profiles

Extends Supabase `auth.users`. One row per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = auth.uid() |
| full_name | text | |
| phone | text | |
| role | enum | platform_admin, shop_owner, shop_staff, supplier, delivery_operator |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

---

## shops

One shop per shop_owner. A shop_owner may own multiple shops.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| owner_id | uuid FK → profiles.id | |
| phone | text | |
| address | text | |
| city | text | |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## shop_staff

Links shop_staff users to a specific shop. A user can be staff at only one shop in MVP.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| shop_id | uuid FK → shops.id | |
| user_id | uuid FK → profiles.id | |
| created_at | timestamptz | |

---

## products

Global product catalog. Not shop-specific. Managed by platform_admin.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| slug | text UNIQUE | URL-safe identifier |
| description | text | |
| category | text | e.g. alimentation, boissons, hygiène |
| unit | text | piece, kg, litre, carton, sac |
| image_url | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## suppliers

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | nullable (supplier may not have an account yet) |
| name | text | Company or trader name |
| contact_name | text | |
| phone | text | |
| email | text | |
| address | text | |
| city | text | |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## supplier_products

Which products a supplier carries, and at what price.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| supplier_id | uuid FK → suppliers.id | |
| product_id | uuid FK → products.id | |
| unit_price | numeric | |
| currency | text | CDF or USD |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## inventory_items

**Source of truth for current stock per shop per product.**

One row per (shop_id, product_id) pair. Do not duplicate this pair.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| shop_id | uuid FK → shops.id | |
| product_id | uuid FK → products.id | |
| quantity_on_hand | numeric | Current quantity. Must never go below 0 without an explicit adjustment. |
| min_quantity | numeric | Reorder alert threshold. Default 0. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraint:** (shop_id, product_id) UNIQUE

---

## stock_movements

**Audit trail for every change to inventory_items.quantity_on_hand.**

Never update `quantity_on_hand` directly. Always insert a `stock_movement` and let a DB trigger or server action update `inventory_items`.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| inventory_item_id | uuid FK → inventory_items.id | |
| shop_id | uuid FK → shops.id | Denormalized for query performance |
| product_id | uuid FK → products.id | Denormalized |
| movement_type | enum | purchase_in, sale_out, adjustment, damage, transfer_in, transfer_out |
| quantity | numeric | Always positive. Direction is encoded in movement_type. |
| reference_id | uuid | nullable — links to orders.id or deliveries.id |
| reference_type | text | nullable — 'order', 'delivery', 'manual' |
| note | text | nullable |
| created_by | uuid FK → profiles.id | |
| created_at | timestamptz | |

---

## orders

A shop places an order to a supplier.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| shop_id | uuid FK → shops.id | |
| supplier_id | uuid FK → suppliers.id | |
| status | enum | draft, submitted, confirmed, shipped, delivered, cancelled |
| total_amount | numeric | |
| currency | text | CDF or USD |
| notes | text | |
| created_by | uuid FK → profiles.id | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## order_items

Line items within an order.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id | uuid FK → orders.id | |
| product_id | uuid FK → products.id | |
| quantity | numeric | |
| unit_price | numeric | Price at time of order |
| currency | text | |

---

## deliveries

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id | uuid FK → orders.id | |
| operator_id | uuid FK → profiles.id | The delivery_operator assigned |
| status | enum | pending, in_transit, delivered, failed |
| scheduled_date | date | |
| delivered_at | timestamptz | nullable |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## payments

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id | uuid FK → orders.id | |
| shop_id | uuid FK → shops.id | Denormalized |
| amount | numeric | |
| currency | text | CDF or USD |
| payment_method | enum | cash, mobile_money, bank_transfer |
| status | enum | pending, completed, failed |
| reference_number | text | nullable — receipt or transaction ID |
| paid_at | timestamptz | nullable |
| created_at | timestamptz | |

---

## activity_log

Append-only log of all significant actions in the system.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid FK → profiles.id | Who performed the action |
| action | text | e.g. 'order.created', 'stock.adjusted', 'delivery.updated' |
| entity_type | text | e.g. 'order', 'inventory_item', 'delivery' |
| entity_id | uuid | |
| meta | jsonb | Snapshot of relevant fields at time of action |
| created_at | timestamptz | |

---

## Enums summary

```sql
role: platform_admin | shop_owner | shop_staff | supplier | delivery_operator
movement_type: purchase_in | sale_out | adjustment | damage | transfer_in | transfer_out
order_status: draft | submitted | confirmed | shipped | delivered | cancelled
delivery_status: pending | in_transit | delivered | failed
payment_method: cash | mobile_money | bank_transfer
payment_status: pending | completed | failed
currency: CDF | USD
```
