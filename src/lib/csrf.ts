import crypto from 'crypto'

const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_LENGTH = 32

/** Generuje náhodný CSRF token (hex string). */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

/** Vrací název CSRF cookie. */
export function getCsrfCookieName(): string {
  return CSRF_COOKIE
}

/** Vrací název CSRF headeru. */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER
}
