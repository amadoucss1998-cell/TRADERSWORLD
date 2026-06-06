import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED = ['/search', '/scholarships', '/applications', '/documents', '/profile', '/dashboard']
const AUTH_PAGES = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('sp_token')?.value

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.some(p => pathname.startsWith(p))

  const session = token ? await verifyToken(token) : null

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/register
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/search', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
