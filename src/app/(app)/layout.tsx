import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/src/lib/auth/get-current-profile'
import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { AppShell } from '@/src/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (isDevPreview()) {
    return <AppShell profile={DEV_PROFILE}>{children}</AppShell>
  }

  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  return <AppShell profile={profile}>{children}</AppShell>
}
