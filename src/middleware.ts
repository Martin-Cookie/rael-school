import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken, getCsrfCookieName, getCsrfHeaderName } from '@/lib/csrf'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

// Cesty vyloučené z CSRF kontroly (login nastavuje cookie, nemá ještě token)
const CSRF_EXEMPT = new Set(['/api/auth/login'])

export function middleware(request: NextRequest) {
  const { method, nextUrl } = request
  const path = nextUrl.pathname

  // Jen API routes
  if (!path.startsWith('/api/')) {
    return addCsrfCookie(request, NextResponse.next())
  }

  // Ověřit CSRF token pro mutující metody
  if (MUTATING_METHODS.has(method) && !CSRF_EXEMPT.has(path)) {
    const cookieToken = request.cookies.get(getCsrfCookieName())?.value
    const headerToken = request.headers.get(getCsrfHeaderName())

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json({ error: 'CSRF token mismatch' }, { status: 403 })
    }
  }

  return addCsrfCookie(request, NextResponse.next())
}

/** Přidá CSRF cookie do response pokud chybí v requestu. */
function addCsrfCookie(request: NextRequest, response: NextResponse): NextResponse {
  const existing = request.cookies.get(getCsrfCookieName())?.value
  if (!existing) {
    const token = generateCsrfToken()
    response.cookies.set(getCsrfCookieName(), token, {
      httpOnly: false, // Frontend musí číst cookie
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
}
