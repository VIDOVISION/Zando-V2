# Zando V2 — Role Permissions

## Roles

| Role | Description |
|---|---|
| platform_admin | Full access to all data and all shops |
| shop_owner | Manages their own shop(s), staff, stock, orders, payments |
| shop_staff | Operates within a single assigned shop with limited write access |
| supplier | Views orders directed at them, manages their product catalog |
| delivery_operator | Views and updates assigned deliveries only |

---

## Permission matrix

Legend: `C` = Create, `R` = Read, `U` = Update, `D` = Delete, `-` = No access

### profiles

| Role | Own profile | Other profiles |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | RU | R (their staff only) |
| shop_staff | RU | - |
| supplier | RU | - |
| delivery_operator | RU | - |

---

### shops

| Role | Own shop(s) | Other shops |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | CRUD | - |
| shop_staff | R | - |
| supplier | - | - |
| delivery_operator | - | - |

---

### shop_staff

| Role | Their shop's staff | Other shops' staff |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | CRD | - |
| shop_staff | R (self) | - |
| supplier | - | - |
| delivery_operator | - | - |

---

### products (global catalog)

| Role | Action |
|---|---|
| platform_admin | CRUD |
| shop_owner | R |
| shop_staff | R |
| supplier | R |
| delivery_operator | R |

---

### suppliers

| Role | Own supplier record | Other suppliers |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | R | R |
| shop_staff | R | R |
| supplier | RU (own) | - |
| delivery_operator | - | - |

---

### supplier_products

| Role | Own supplier | Other suppliers |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | R | R |
| shop_staff | R | R |
| supplier | CRUD (own) | - |
| delivery_operator | - | - |

---

### inventory_items

| Role | Own shop | Other shops |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | CRUD | - |
| shop_staff | RU | - |
| supplier | - | - |
| delivery_operator | - | - |

Note: Updates to `quantity_on_hand` must always go through a `stock_movement` insert, never a direct UPDATE.

---

### stock_movements

| Role | Own shop | Other shops |
|---|---|---|
| platform_admin | CR | CR |
| shop_owner | CR | - |
| shop_staff | CR | - |
| supplier | - | - |
| delivery_operator | - | - |

Stock movements are append-only. No updates or deletes allowed.

---

### orders

| Role | Own shop's orders | All orders |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | CRUD | - |
| shop_staff | CR (draft only) | - |
| supplier | R (directed to them) | - |
| delivery_operator | R (linked to their delivery) | - |

---

### order_items

Same scope rules as `orders`.

---

### deliveries

| Role | Assigned to them | All deliveries |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | R (their shop's) | - |
| shop_staff | R (their shop's) | - |
| supplier | - | - |
| delivery_operator | RU (own) | - |

delivery_operator may only update `status`, `delivered_at`, `notes`.

---

### payments

| Role | Own shop | All payments |
|---|---|---|
| platform_admin | CRUD | CRUD |
| shop_owner | CR | - |
| shop_staff | R | - |
| supplier | R (for their orders) | - |
| delivery_operator | - | - |

---

### activity_log

| Role | Access |
|---|---|
| platform_admin | R (all) |
| shop_owner | R (own shop's actions) |
| shop_staff | R (own shop's actions) |
| supplier | R (their own actions) |
| delivery_operator | R (their own actions) |

Activity log is insert-only. No one can update or delete entries.
