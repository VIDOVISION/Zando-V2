import 'server-only'
import { cache } from 'react'
import { createClient } from '@/src/lib/supabase/server'
import type { UserRole } from './roles'

// Shape of a row in public.profiles. Kept in sync with the schema until
// `supabase gen types` replaces src/lib/supabase/types.ts with real types.
export type Profile = {
  id: string
  organization_id: string | null
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// Cached for the lifetime of a single server render pass (React cache).
// Returns null when the user is not authenticated or their profile row is missing.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, full_name, phone, role, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return data as Profile
})
