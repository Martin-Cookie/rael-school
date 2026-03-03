const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_LENGTH = 32

/** Generuje náhodný CSRF token (hex string). Kompatibilní s Edge Runtime. */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Vrací název CSRF cookie. */
export function getCsrfCookieName(): string {
  return CSRF_COOKIE
}

/** Vrací název CSRF headeru. */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER
}
