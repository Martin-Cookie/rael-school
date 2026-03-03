import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn(),
  createToken: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
}))

import { prisma } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

// Helper to create mock NextRequest
function mockRequest(body: object): any {
  return {
    json: () => Promise.resolve(body),
    headers: new Map([['x-forwarded-for', '127.0.0.1']]),
  }
}

describe('POST /api/auth/login', () => {
  let POST: (request: any) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(checkRateLimit as any).mockReturnValue({ success: true })
    const mod = await import('@/app/api/auth/login/route')
    POST = mod.POST
  })

  it('returns 400 if email or password missing', async () => {
    const res = await POST(mockRequest({ email: '', password: '' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('required')
  })

  it('returns 429 if rate limited', async () => {
    ;(checkRateLimit as any).mockReturnValue({ success: false, retryAfter: 60 })
    const res = await POST(mockRequest({ email: 'test@test.com', password: 'pass' }))
    expect(res.status).toBe(429)
  })

  it('returns 401 for non-existent user', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(null)
    const res = await POST(mockRequest({ email: 'none@test.com', password: 'pass' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 for inactive user', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@test.com', isActive: false, password: 'hash' })
    const res = await POST(mockRequest({ email: 'test@test.com', password: 'pass' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 for wrong password', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@test.com', isActive: true, password: 'hash' })
    ;(verifyPassword as any).mockResolvedValue(false)
    const res = await POST(mockRequest({ email: 'test@test.com', password: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('returns user data on successful login', async () => {
    const mockUser = { id: '1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN', isActive: true, password: 'hash' }
    ;(prisma.user.findUnique as any).mockResolvedValue(mockUser)
    ;(verifyPassword as any).mockResolvedValue(true)
    ;(createToken as any).mockReturnValue('mock-jwt-token')

    const res = await POST(mockRequest({ email: 'admin@test.com', password: 'pass' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user.email).toBe('admin@test.com')
    expect(data.user.role).toBe('ADMIN')
    expect(data.user.password).toBeUndefined()
  })
})
