import { describe, it, expect, beforeAll } from 'vitest'

// Set JWT_SECRET before importing auth module
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest-only'
})

describe('auth role helpers', () => {
  // Lazy import to ensure JWT_SECRET is set first
  let isAdmin: (role: string) => boolean
  let isManager: (role: string) => boolean
  let canEdit: (role: string) => boolean
  let isSponsor: (role: string) => boolean
  let canAccess: (userRole: string, requiredRoles: string[]) => boolean

  beforeAll(async () => {
    const auth = await import('@/lib/auth')
    isAdmin = auth.isAdmin
    isManager = auth.isManager
    canEdit = auth.canEdit
    isSponsor = auth.isSponsor
    canAccess = auth.canAccess
  })

  it('isAdmin returns true only for ADMIN', () => {
    expect(isAdmin('ADMIN')).toBe(true)
    expect(isAdmin('MANAGER')).toBe(false)
    expect(isAdmin('SPONSOR')).toBe(false)
    expect(isAdmin('VOLUNTEER')).toBe(false)
  })

  it('isManager returns true for ADMIN and MANAGER', () => {
    expect(isManager('ADMIN')).toBe(true)
    expect(isManager('MANAGER')).toBe(true)
    expect(isManager('SPONSOR')).toBe(false)
    expect(isManager('VOLUNTEER')).toBe(false)
  })

  it('canEdit returns true for ADMIN, MANAGER, VOLUNTEER', () => {
    expect(canEdit('ADMIN')).toBe(true)
    expect(canEdit('MANAGER')).toBe(true)
    expect(canEdit('VOLUNTEER')).toBe(true)
    expect(canEdit('SPONSOR')).toBe(false)
  })

  it('isSponsor returns true only for SPONSOR', () => {
    expect(isSponsor('SPONSOR')).toBe(true)
    expect(isSponsor('ADMIN')).toBe(false)
  })

  it('canAccess checks role against required roles', () => {
    expect(canAccess('ADMIN', ['ADMIN', 'MANAGER'])).toBe(true)
    expect(canAccess('SPONSOR', ['ADMIN', 'MANAGER'])).toBe(false)
  })
})

describe('auth token functions', () => {
  let createToken: any
  let verifyToken: any

  beforeAll(async () => {
    const auth = await import('@/lib/auth')
    createToken = auth.createToken
    verifyToken = auth.verifyToken
  })

  it('creates and verifies a valid token', () => {
    const user = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'ADMIN' }
    const token = createToken(user)
    expect(typeof token).toBe('string')

    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.email).toBe('test@example.com')
    expect(decoded!.role).toBe('ADMIN')
  })

  it('returns null for invalid token', () => {
    const decoded = verifyToken('invalid-token-string')
    expect(decoded).toBeNull()
  })

  it('returns null for empty token', () => {
    const decoded = verifyToken('')
    expect(decoded).toBeNull()
  })
})

describe('auth password functions', () => {
  let hashPassword: any
  let verifyPassword: any

  beforeAll(async () => {
    const auth = await import('@/lib/auth')
    hashPassword = auth.hashPassword
    verifyPassword = auth.verifyPassword
  })

  it('hashes and verifies password correctly', async () => {
    const hash = await hashPassword('admin123')
    expect(hash).not.toBe('admin123')
    expect(await verifyPassword('admin123', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
