import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // Auto-generate a strong secret for development (not persisted)
    const generated = crypto.randomBytes(32).toString('base64')
    console.warn('[AUTH] JWT_SECRET not set — using auto-generated secret. Set JWT_SECRET in .env for production.')
    return generated
  }
  // Warn about weak secrets (short or containing predictable patterns)
  if (secret.length < 32 || /rael|school|secret|password|test|demo/i.test(secret)) {
    console.warn('[AUTH] JWT_SECRET appears weak. Generate a strong one: openssl rand -base64 32')
  }
  return secret
})()

export interface UserPayload {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

/** Zahashuje heslo pomocí bcrypt (10 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/** Porovná plain-text heslo s bcrypt hashem. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Vytvoří JWT token s 24h expirací pro daného uživatele. */
export function createToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

/** Ověří a dekóduje JWT token. Vrací `null` pokud je token neplatný nebo expirovaný. */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

/** Načte aktuálního uživatele z httpOnly cookie `auth-token`. Vrací `null` pokud není přihlášen. */
export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

/** Ověří, zda role uživatele je v seznamu povolených rolí. */
export function canAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/** `true` pokud role je ADMIN. */
export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

/** `true` pokud role je ADMIN nebo MANAGER. */
export function isManager(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

/** `true` pokud role může editovat data (ADMIN, MANAGER, VOLUNTEER). */
export function canEdit(role: string): boolean {
  return ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(role)
}

/** `true` pokud role je SPONSOR (read-only přístup ke svým studentům). */
export function isSponsor(role: string): boolean {
  return role === 'SPONSOR'
}
