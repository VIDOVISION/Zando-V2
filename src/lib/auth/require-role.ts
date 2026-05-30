import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from './get-current-profile'
import type { UserRole } from './roles'
import type { Profile } from './get-current-profile'

// Asserts that the current request is authenticated and the user holds one of
// the `allowed` roles. Redirects on failure — never returns null.
export async function requireRole(...allowed: readonly UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  if (!allowed.includes(profile.role)) {
    redirect('/unauthorized')
  }

  return profile
}

// Shorthand for platform_admin-only server code.
export async function requireAdmin(): Promise<Profile> {
  return requireRole('platform_admin')
}
