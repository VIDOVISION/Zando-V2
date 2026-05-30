# Zando V2 — Build Order

Build one module at a time. Each phase must be complete and working before moving to the next.

---

## Phase 0 — Foundation

**Goal:** Supabase connected, auth working, role-based routing in place.

- [ ] Set up Supabase project and get credentials
- [x] Install Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Create all tables from database-schema.md (`supabase/migrations/0001_zando_v2_core_schema.sql`)
- [x] Write RLS policies per role-permissions.md (included in migration 0001)
- [x] Create enums in Postgres (included in migration 0001)
- [x] Create `profiles` trigger (auto-create profile on auth.user insert — `trg_create_profile_on_signup` in migration 0001)
- [x] Set up Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`, `types.ts`)
- [x] Set up auth + role foundation (`src/lib/auth/`, `proxy.ts`, `app/auth/callback/route.ts`)
- [ ] Build login page (`/login`)
- [ ] Build post-login redirect by role
- [ ] Test: each role can log in and land on their dashboard shell

---

## Phase 1 — Dashboard shells

**Goal:** Each role sees their dashboard with real layout, no data yet.

- [ ] Build shared layout (bottom tabs on mobile, sidebar on desktop)
- [ ] Build dashboard page per role (empty state cards)
- [ ] Implement role-aware navigation (tabs visible based on profile.role)
- [ ] Test: UI renders correctly on 375px (iPhone SE) and 1280px (desktop)

---

## Phase 2 — Products

**Goal:** Global product catalog visible to all roles. Admin can manage.

- [ ] Products list page with search and category filter
- [ ] Product detail page
- [ ] Create/edit product form (platform_admin only)
- [ ] Seed file: `fixtures/products.ts` with 20 sample products
- [ ] Test: non-admin roles see products read-only

---

## Phase 3 — Inventory

**Goal:** Shops can see and manage their stock.

- [ ] Inventory list page (filtered to current shop)
- [ ] Inventory item detail with movement history
- [ ] Stock adjustment form (manual in/out)
- [ ] DB trigger: stock_movements insert → update inventory_items.quantity_on_hand
- [ ] Low-stock alert badge on nav tab
- [ ] Test: adjusting stock creates a stock_movement row and updates quantity_on_hand

---

## Phase 4 — Suppliers

**Goal:** Supplier directory visible to shops. Suppliers can manage their own profile.

- [ ] Suppliers list page
- [ ] Supplier detail with their product catalog
- [ ] supplier_products list and price editing (supplier role)
- [ ] Create supplier form (platform_admin only)
- [ ] Test: supplier can edit their own products, not others

---

## Phase 5 — Orders

**Goal:** Shop places an order to a supplier. Supplier confirms. Status flows.

- [ ] New order form: select supplier → add line items → submit
- [ ] Order list (filtered by role: shop sees own orders, supplier sees orders directed to them)
- [ ] Order detail page with status badge and line items
- [ ] Order status transitions: draft → submitted → confirmed → shipped → delivered / cancelled
- [ ] Activity log entry on each status change
- [ ] Test: full order lifecycle with two accounts (shop_owner + supplier)

---

## Phase 6 — Deliveries

**Goal:** Delivery operator is assigned and updates status.

- [ ] Delivery created when order moves to `shipped`
- [ ] Delivery list (operator sees their own)
- [ ] Delivery detail with status update form
- [ ] When delivery → `delivered`: trigger stock_movement insert (purchase_in for the shop)
- [ ] Test: delivered order increments shop inventory automatically

---

## Phase 7 — Payments

**Goal:** Payments are recorded and linked to orders.

- [ ] Record payment form (linked to an order)
- [ ] Payment list (shop_owner, platform_admin)
- [ ] Payment detail
- [ ] Test: payment linked to delivered order, visible in shop finances

---

## Phase 8 — Activity feed

**Goal:** All significant actions are logged and visible.

- [ ] Activity log inserts on: order created/updated, stock adjusted, delivery updated, payment recorded
- [ ] Activity feed page with role-scoped filter
- [ ] Test: actions appear in feed with actor name, timestamp, and entity link

---

## Phase 9 — Polish

- [ ] Empty states for all list pages
- [ ] Error boundaries
- [ ] Loading skeletons for data-heavy pages
- [ ] Form validation messages
- [ ] Low-stock dashboard widget
- [ ] Run `npm run build` with zero errors
