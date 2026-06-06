import { NextRequest, NextResponse } from 'next/server'
import { getSessionTokenFromRequest, validateSession } from './lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/predictions/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
    '/about/:path*',
    '/admin/:path*',
    '/api/predictions/:path*',
    '/api/group-predictions/:path*',
    '/api/user-groups/:path*',
    '/api/leaderboard/:path*',
    '/api/matches/:path*',
    '/api/profile/:path*',
    '/api/admin/:path*',
    '/api/auth/logout',
    '/api/auth/me',
  ],
}

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login'])
const ADMIN_PATHS_PREFIX = ['/admin', '/api/admin']

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const token = getSessionTokenFromRequest(request)

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let user
  try {
    user = await validateSession(token)
  } catch {
    user = null
  }

  if (!user) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ success: false, error: 'Sitzung abgelaufen' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('wm_session')
    return response
  }

  if (user.is_banned) {
    const response = NextResponse.redirect(new URL('/login?banned=1', request.url))
    response.cookies.delete('wm_session')
    return response
  }

  const isAdminPath = ADMIN_PATHS_PREFIX.some((p) => pathname.startsWith(p))
  if (isAdminPath && user.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Forward user info to API routes via headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-username', user.username)

  return NextResponse.next({ request: { headers: requestHeaders } })
}
