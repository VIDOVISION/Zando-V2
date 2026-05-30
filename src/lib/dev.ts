import 'server-only'
import type { Profile } from './auth/get-current-profile'

// Returns true only when ZANDO_DEV_PREVIEW=true is explicitly set.
// This variable must never be set in production deployments.
export function isDevPreview(): boolean {
  return process.env.ZANDO_DEV_PREVIEW === 'true'
}

// Placeholder profile used when dev preview bypasses Supabase auth.
// Not a real user — used only for local development layout rendering.
export const DEV_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000000',
  organization_id: null,
  full_name: 'Dev Preview',
  phone: null,
  role: 'platform_admin',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}
