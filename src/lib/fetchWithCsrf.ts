/** Přečte CSRF token z cookie. */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Wrapper kolem fetch, který automaticky přidá CSRF header
 * pro mutující metody (POST/PUT/DELETE/PATCH).
 */
export function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase()
  const mutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

  if (mutating) {
    const token = getCsrfToken()
    if (token) {
      const headers = new Headers(options.headers)
      headers.set('x-csrf-token', token)
      options = { ...options, headers }
    }
  }

  return fetch(url, options)
}
