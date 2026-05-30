import type { UserRole } from '@/src/lib/supabase/types'

export type { UserRole }

export const ALL_ROLES = [
  'platform_admin',
  'shop_owner',
  'shop_staff',
  'supplier',
  'delivery_operator',
] as const satisfies readonly UserRole[]

// Roles that operate within a specific shop context.
export const SHOP_ROLES = ['shop_owner', 'shop_staff'] as const satisfies readonly UserRole[]

// Roles that can initiate or modify orders from the shop side.
export const ORDER_INITIATOR_ROLES = [
  'shop_owner',
  'shop_staff',
] as const satisfies readonly UserRole[]

export function isAdmin(role: UserRole): boolean {
  return role === 'platform_admin'
}

export function isShopRole(role: UserRole): boolean {
  return (SHOP_ROLES as readonly UserRole[]).includes(role)
}

// Returns true if `role` is one of the `allowed` roles.
export function hasRole(role: UserRole, ...allowed: readonly UserRole[]): boolean {
  return allowed.includes(role)
}
