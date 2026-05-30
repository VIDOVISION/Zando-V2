# Zando V2 — UI Map

## Navigation model

**Mobile (primary):** Bottom tab bar with 4-5 tabs. Contextual actions via sheets and drawers.

**Desktop (secondary):** Fixed left sidebar with full labels. Content area on the right.

Role determines which tabs/sections appear after login.

---

## Route structure

```
/
├── (auth)
│   ├── login                  — Email + password login
│   └── register               — Invite-only or self-register (TBD)
│
├── (app)                      — Requires authentication
│   ├── dashboard              — Role-aware home screen
│   │
│   ├── products               — Global product catalog
│   │   ├── [id]               — Product detail
│   │   └── new                — Admin only
│   │
│   ├── inventory              — Shop-scoped stock view
│   │   ├── [itemId]           — Inventory item detail + movement history
│   │   └── adjust             — Manual stock adjustment form
│   │
│   ├── orders
│   │   ├── new                — Place new order (shop_owner, shop_staff)
│   │   ├── [id]               — Order detail
│   │   └── [id]/items         — Line items within order
│   │
│   ├── suppliers
│   │   ├── [id]               — Supplier detail + products
│   │   └── new                — Admin only
│   │
│   ├── deliveries
│   │   └── [id]               — Delivery detail (operator updates status here)
│   │
│   ├── payments
│   │   ├── [id]               — Payment detail
│   │   └── new                — Record a payment
│   │
│   ├── activity               — Filtered activity feed
│   │
│   └── settings
│       ├── shop               — Shop profile (shop_owner)
│       ├── staff              — Manage staff (shop_owner)
│       └── account            — Personal profile (all roles)
```

---

## Dashboard by role

### platform_admin
- Summary cards: total shops, active orders, revenue today, deliveries in transit
- Recent activity feed
- Quick links: shops, products, all orders

### shop_owner
- Summary cards: stock alerts (below min_quantity), open orders, unpaid invoices
- Low-stock product list
- Recent orders
- Quick action: New order, Adjust stock

### shop_staff
- Same as shop_owner but no financial totals
- Quick action: Adjust stock, View orders

### supplier
- Summary cards: open orders, orders to fulfill today
- Pending orders list

### delivery_operator
- Summary cards: deliveries assigned today, in transit
- Delivery list sorted by scheduled_date

---

## Mobile navigation tabs by role

### shop_owner / shop_staff
1. Dashboard
2. Inventory
3. Orders
4. Payments (shop_owner only)
5. More (activity, settings)

### supplier
1. Dashboard
2. Orders
3. Products (their catalog)
4. More (settings)

### delivery_operator
1. Dashboard
2. Deliveries
3. More (settings)

### platform_admin
1. Dashboard
2. Shops
3. Products
4. Orders
5. More (suppliers, deliveries, payments, activity, settings)

---

## Key UI patterns

- **Empty states:** Every list has a clear empty state with a CTA (e.g. "No orders yet — Place your first order")
- **Status badges:** Color-coded chips for order/delivery/payment status
- **Stock alerts:** Red badge on inventory tab when items are below min_quantity
- **Confirmation sheets:** Destructive actions (cancel order, delete product) use a bottom sheet confirm step on mobile
- **Currency display:** Always show currency code (CDF or USD) next to amounts, never assume
