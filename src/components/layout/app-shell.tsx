import type { Profile } from '@/src/lib/auth/get-current-profile'
import { TopHeader } from './top-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { DesktopSidebar } from './desktop-sidebar'

type Props = {
  profile: Profile
  children: React.ReactNode
}

export function AppShell({ profile, children }: Props) {
  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar profile={profile} />

      {/* Main column */}
      <div className="flex min-h-0 flex-1 flex-col">
        <TopHeader profile={profile} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav — hidden on desktop */}
        <MobileBottomNav />
      </div>
    </div>
  )
}
