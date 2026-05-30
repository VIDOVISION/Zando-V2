import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Runs on every non-static request to keep the Supabase session fresh.
// Route protection (redirect to /login) is handled inside individual page
// Server Components via requireRole(), not here.
export async function proxy(request: NextRequest) {
  // Skip session refresh when ZANDO_DEV_PREVIEW=true or when Supabase is not
  // yet configured (no credentials in .env.local). This lets developers access
  // the app shell without a live Supabase project.
  const devPreview = process.env.ZANDO_DEV_PREVIEW === 'true'
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (devPreview || !supabaseConfigured) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto the request so downstream server code
          // within the same request can read the refreshed values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Re-create the response so updated cookies are sent to the browser.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() triggers a silent token refresh when the access token is close
  // to expiry. The result is intentionally discarded — each page enforces its
  // own auth requirements via requireRole().
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static assets.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
