import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Paths that don't require authentication
const publicPaths = ['/login', '/setup', '/guest']
// API paths that are public (guest-facing only)
const publicApiPaths = ['/api/guest/']

function isPublicPath(pathname: string): boolean {
  if (publicPaths.some((path) => pathname.startsWith(path))) return true
  if (publicApiPaths.some((path) => pathname.startsWith(path))) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  const { user, supabaseResponse } = await updateSession(request)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
