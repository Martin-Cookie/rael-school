import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'rael-school-secret-key'

export interface UserPayload {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function canAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

export function isManager(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function canEdit(role: string): boolean {
  return ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(role)
}

export function isSponsor(role: string): boolean {
  return role === 'SPONSOR'
}
