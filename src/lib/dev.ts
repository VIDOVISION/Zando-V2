import 'server-only'
import type { Profile } from './auth/get-current-profile'

// Returns true only when ZANDO_DEV_PREVIEW=true is explicitly set.
// This variable must never be set in production deployments.
export function isDevPreview(): boolean {
  return process.env.ZANDO_DEV_PREVIEW === 'true'
}

// Placeholder profile used when dev preview bypasses Supabase auth.
// id and full_name match the demo profile in supabase/seed.sql so that
// getCurrentShopId resolves the demo shop (Boutique Demo Kinshasa) when
// ZANDO_DEV_PREVIEW=true and migration 0004 anon policies are applied.
export const DEV_PROFILE: Profile = {
  id: '10000000-0000-0000-0000-000000000002',
  organization_id: '10000000-0000-0000-0000-000000000001',
  full_name: 'Patron Demo',
  phone: null,
  role: 'shop_owner',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}
