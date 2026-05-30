import type { Profile } from '@/src/lib/auth/get-current-profile'

const LABELS = {
  brand: 'Zando',
} as const

type Props = {
  profile: Profile
}

export function TopHeader({ profile }: Props) {
  const initial = profile.full_name.charAt(0).toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Brand wordmark */}
      <span className="text-lg font-bold text-[#0d9488]">{LABELS.brand}</span>

      {/* User avatar */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d9488] text-sm font-semibold text-white"
        aria-label={`Profil de ${profile.full_name}`}
        role="img"
      >
        {initial}
      </div>
    </header>
  )
}
