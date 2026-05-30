# Zando V2 — Business Rules

## Stock rules

1. **Single source of truth:** `inventory_items.quantity_on_hand` is the current stock count for a (shop, product) pair.

2. **Audit trail is mandatory:** Every change to `quantity_on_hand` must be recorded as a `stock_movements` row first. A DB trigger then recalculates `quantity_on_hand`. Never UPDATE `inventory_items` directly from application code.

3. **Quantity is always positive:** The `stock_movements.quantity` field is always a positive number. The direction (in or out) is encoded in `movement_type`:
   - `purchase_in`, `transfer_in` → add to quantity_on_hand
   - `sale_out`, `transfer_out`, `damage` → subtract from quantity_on_hand
   - `adjustment` → can increase or decrease; use a `note` to explain

4. **No negative stock:** quantity_on_hand cannot go below 0. Any movement that would cause negative stock must be rejected with a clear error message.

5. **Delivery triggers stock-in:** When a delivery's status is set to `delivered`, the system must automatically insert `stock_movements` rows (movement_type = `purchase_in`) for each `order_item` in the linked order.

6. **Low-stock alert:** An inventory_item is "low stock" when `quantity_on_hand <= min_quantity`. This state is computed, not stored.

---

## Order rules

1. **Status is one-directional:** Orders cannot move backwards in status. The allowed transitions are:
   ```
   draft → submitted → confirmed → shipped → delivered
   draft → cancelled
   submitted → cancelled
   confirmed → cancelled  (requires platform_admin or supplier confirmation)
   shipped → (no cancellation — contact admin)
   ```

2. **Order items are locked after submission:** Once an order moves out of `draft`, `order_items` cannot be added, removed, or edited.

3. **One delivery per order:** Each order has at most one delivery record in MVP. Multi-stop or partial deliveries are out of scope.

4. **Currency must be consistent:** All `order_items` within one order must use the same currency as the order's `currency` field.

---

## Payment rules

1. **Payments are linked to orders:** Every payment must reference an `order_id`.

2. **One payment per order in MVP:** Multiple partial payments per order are out of scope for now.

3. **Payments are not auto-created:** Recording a payment is a manual step by shop_owner or platform_admin.

4. **Currency must match the order:** A payment's currency must match its linked order's currency.

---

## Role rules

1. **Shop scope is enforced at DB level:** RLS policies ensure that shop_owner and shop_staff only see rows where `shop_id` matches their assigned shop. This must never be enforced only at the application layer.

2. **Staff belongs to one shop:** In MVP, a shop_staff user can only be assigned to one shop. This is enforced by a UNIQUE constraint on (user_id) in `shop_staff`.

3. **Supplier with no account:** A supplier can exist in the `suppliers` table without a linked `user_id`. Platform_admin creates the supplier record. The supplier_user association is optional.

4. **platform_admin bypasses RLS:** The platform_admin role uses a Supabase service role or a bypass policy to access all data. Application code must never expose service role keys to the client.

---

## Data integrity rules

1. **No direct foreign key to auth.users:** Application tables reference `profiles.id`, not `auth.users.id` directly (even though they share the same UUID).

2. **Soft deletes preferred:** For shops and suppliers, set `is_active = false` instead of deleting the row. This preserves historical references.

3. **activity_log is immutable:** No UPDATE or DELETE is allowed on `activity_log`. Enforce with RLS + a CHECK constraint.

4. **Timestamps in UTC:** All timestamps are stored in UTC. The UI converts to local time on display.

5. **Currency codes are uppercase:** Always store and display `CDF` and `USD`, never `cdf`, `usd`, `$`, or `FC`.
