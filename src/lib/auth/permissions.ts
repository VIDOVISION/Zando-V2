// Permission matrix — mirrors zando-docs/role-permissions.md.
// Source of truth for which roles may perform each CRUD action on each resource.
// RLS in the database is the enforcement layer; this file drives UI visibility
// and early-return guards in Server Actions.

import type { UserRole } from './roles'

type Action = 'create' | 'read' | 'update' | 'delete'
type PermissionMap = Partial<Record<Action, readonly UserRole[]>>

const PERMISSIONS = {
  profiles: {
    // All roles can read and update their own profile row.
    // Cross-user access is restricted by RLS at the database layer.
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    update: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    // Profiles are created by the auth trigger, not application code.
    // platform_admin may create or delete profiles via admin tooling only.
    create: ['platform_admin'],
    delete: ['platform_admin'],
  },
  organizations: {
    create: ['platform_admin'],
    read: ['platform_admin'],
    update: ['platform_admin'],
    delete: ['platform_admin'],
  },
  shops: {
    create: ['platform_admin', 'shop_owner'],
    read: ['platform_admin', 'shop_owner', 'shop_staff'],
    update: ['platform_admin', 'shop_owner'],
    delete: ['platform_admin', 'shop_owner'],
  },
  shop_staff: {
    create: ['platform_admin', 'shop_owner'],
    read: ['platform_admin', 'shop_owner', 'shop_staff'],
    update: ['platform_admin', 'shop_owner'],
    delete: ['platform_admin', 'shop_owner'],
  },
  products: {
    create: ['platform_admin'],
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    update: ['platform_admin'],
    delete: ['platform_admin'],
  },
  product_categories: {
    create: ['platform_admin'],
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    update: ['platform_admin'],
    delete: ['platform_admin'],
  },
  suppliers: {
    create: ['platform_admin'],
    read: ['platform_admin', 'shop_owner', 'shop_staff', 'supplier'],
    update: ['platform_admin', 'supplier'],
    delete: ['platform_admin'],
  },
  supplier_products: {
    create: ['platform_admin', 'supplier'],
    read: ['platform_admin', 'shop_owner', 'shop_staff', 'supplier'],
    update: ['platform_admin', 'supplier'],
    delete: ['platform_admin', 'supplier'],
  },
  inventory_items: {
    create: ['platform_admin', 'shop_owner'],
    read: ['platform_admin', 'shop_owner', 'shop_staff'],
    // quantity_on_hand must only change via stock_movements; update here means
    // editing min_quantity or other metadata.
    update: ['platform_admin', 'shop_owner', 'shop_staff'],
    delete: ['platform_admin'],
  },
  stock_movements: {
    create: ['platform_admin', 'shop_owner', 'shop_staff'],
    read: ['platform_admin', 'shop_owner', 'shop_staff'],
    // Append-only: no update or delete.
  },
  orders: {
    create: ['platform_admin', 'shop_owner', 'shop_staff'],
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    update: ['platform_admin', 'shop_owner'],
    delete: ['platform_admin'],
  },
  order_items: {
    create: ['platform_admin', 'shop_owner', 'shop_staff'],
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    update: ['platform_admin', 'shop_owner'],
    delete: ['platform_admin'],
  },
  deliveries: {
    create: ['platform_admin'],
    read: ['platform_admin', 'shop_owner', 'shop_staff', 'delivery_operator'],
    // delivery_operator may only update status, delivered_at, notes (enforced at call site).
    update: ['platform_admin', 'delivery_operator'],
    delete: ['platform_admin'],
  },
  payments: {
    create: ['platform_admin', 'shop_owner'],
    read: ['platform_admin', 'shop_owner', 'shop_staff', 'supplier'],
    update: ['platform_admin'],
    delete: ['platform_admin'],
  },
  activity_feed: {
    create: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    read: [
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    ],
    // Append-only: no update or delete.
  },
} as const satisfies Record<string, PermissionMap>

export type Resource = keyof typeof PERMISSIONS

export function can(role: UserRole, resource: Resource, action: Action): boolean {
  const map = PERMISSIONS[resource] as PermissionMap
  const allowed = map[action]
  if (!allowed) return false
  return (allowed as readonly string[]).includes(role)
}
