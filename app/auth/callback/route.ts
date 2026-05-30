import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Handles the Supabase OAuth / magic-link callback.
// Supabase redirects here with ?code=... after the user authenticates.
// We exchange the code for a session, then redirect the user forward.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` carries the original destination; default to root if absent.
  const next = searchParams.get('next') ?? '/'
  // Guard against open redirects: only allow relative paths.
  const redirectTo = next.startsWith('/') ? next : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
