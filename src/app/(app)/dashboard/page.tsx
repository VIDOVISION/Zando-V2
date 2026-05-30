import { requireRole } from '@/src/lib/auth/require-role'
import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import type { Profile } from '@/src/lib/auth/get-current-profile'

export default async function DashboardPage() {
  let profile: Profile

  if (isDevPreview()) {
    profile = DEV_PROFILE
  } else {
    profile = await requireRole(
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-foreground">
        Bienvenue, {profile.full_name}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Rôle: {profile.role}
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        Le tableau de bord arrive bientôt.
      </div>
    </div>
  )
}
