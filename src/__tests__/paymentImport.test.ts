import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────

const mockTransaction = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    paymentImportRow: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    paymentImport: { update: vi.fn() },
    paymentType: { findMany: vi.fn() },
    voucherRate: { findMany: vi.fn() },
    voucherPurchase: { create: vi.fn() },
    sponsorPayment: { create: vi.fn() },
    $transaction: (...args: any[]) => mockTransaction(...args),
  },
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  isManager: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
}))

vi.mock('@/lib/tuition', () => ({
  recalcTuitionStatus: vi.fn(),
}))

vi.mock('@/lib/auditLog', () => ({
  logAudit: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { isVoucherPaymentType, isTuitionPaymentType, getVoucherTypeIds, getTuitionTypeIds } from '@/lib/paymentTypes'

// ── Helpers ────────────────────────────────────────

function mockRequest(body: object): any {
  return {
    json: () => Promise.resolve(body),
    headers: new Map([['x-forwarded-for', '127.0.0.1']]),
  }
}

const MOCK_USER = { id: 'u1', email: 'admin@test.com', role: 'ADMIN', firstName: 'Admin', lastName: 'Test' }

const MOCK_PAYMENT_TYPES = [
  { id: 'pt1', name: 'Školné 2026', nameEn: 'Tuition 2026', nameSw: 'Karo 2026' },
  { id: 'pt2', name: 'Stravenky', nameEn: 'Vouchers', nameSw: null },
  { id: 'pt3', name: 'Ordinace', nameEn: null, nameSw: null },
]

const MOCK_ROW_BASE = {
  importId: 'imp1',
  transactionDate: new Date('2026-01-15'),
  currency: 'CZK',
  variableSymbol: '123',
  senderName: 'Test Sender',
  senderAccount: '1234/5678',
  message: 'platba',
  rawData: '{}',
  sponsorId: 's1',
  voucherCount: null,
}

// ── Payment type detection (unit) ──────────────────

describe('payment type detection', () => {
  it('detects voucher types by name', () => {
    expect(isVoucherPaymentType('Stravenky')).toBe(true)
    expect(isVoucherPaymentType('stravenky pro studenta')).toBe(true)
    expect(isVoucherPaymentType('Meal Voucher')).toBe(true)
    expect(isVoucherPaymentType('Školné')).toBe(false)
    expect(isVoucherPaymentType('Ordinace')).toBe(false)
  })

  it('detects tuition types by name (cs/en/sw)', () => {
    expect(isTuitionPaymentType({ id: '1', name: 'Školné' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'test', nameEn: 'Tuition Fee' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'test', nameSw: 'Karo ya shule' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'Stravenky' })).toBe(false)
  })

  it('getVoucherTypeIds filters correctly', () => {
    expect(getVoucherTypeIds(MOCK_PAYMENT_TYPES)).toEqual(['pt2'])
  })

  it('getTuitionTypeIds filters correctly', () => {
    expect(getTuitionTypeIds(MOCK_PAYMENT_TYPES)).toEqual(['pt1'])
  })
})

// ── Approve endpoint ───────────────────────────────

describe('POST /api/payment-imports/[id]/approve', () => {
  let POST: (request: any, ctx: any) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getCurrentUser as any).mockResolvedValue(MOCK_USER)
    ;(isManager as any).mockReturnValue(true)
    ;(checkRateLimit as any).mockReturnValue({ success: true })
    ;(prisma.user.findUnique as any).mockResolvedValue(MOCK_USER)
    ;(prisma.paymentType.findMany as any).mockResolvedValue(MOCK_PAYMENT_TYPES)
    ;(prisma.user.findMany as any).mockResolvedValue([{ id: 's1', firstName: 'Jan', lastName: 'Novák' }])
    ;(prisma.voucherRate.findMany as any).mockResolvedValue([{ currency: 'CZK', rate: 80, isActive: true }])

    const mod = await import('@/app/api/payment-imports/[id]/approve/route')
    POST = mod.POST
  })

  it('returns 401 if not authenticated', async () => {
    ;(getCurrentUser as any).mockResolvedValue(null)
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(401)
  })

  it('returns 401 if not manager role', async () => {
    ;(isManager as any).mockReturnValue(false)
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(401)
  })

  it('returns 429 if rate limited', async () => {
    ;(checkRateLimit as any).mockReturnValue({ success: false, retryAfter: 60 })
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(429)
  })

  it('returns 400 if rowIds is empty', async () => {
    const res = await POST(mockRequest({ rowIds: [] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No rows')
  })

  it('returns 400 if no approvable rows found', async () => {
    ;(prisma.paymentImportRow.findMany as any).mockResolvedValue([])
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No approvable rows')
  })

  it('returns 400 if rows missing studentId or paymentTypeId', async () => {
    ;(prisma.paymentImportRow.findMany as any).mockResolvedValue([
      { id: 'r1', ...MOCK_ROW_BASE, studentId: null, paymentTypeId: 'pt1', amount: 1000, status: 'MATCHED' },
    ])
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('missing student')
    expect(data.incompleteRowIds).toEqual(['r1'])
  })

  it('approves sponsor payment row successfully', async () => {
    const row = { id: 'r1', ...MOCK_ROW_BASE, studentId: 'stu1', paymentTypeId: 'pt1', amount: 3700, status: 'MATCHED' }
    ;(prisma.paymentImportRow.findMany as any).mockResolvedValue([row])

    // $transaction executes the callback with a tx proxy
    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        sponsorPayment: { create: vi.fn().mockResolvedValue({ id: 'sp1' }) },
        voucherPurchase: { create: vi.fn() },
        paymentImportRow: { update: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        paymentImport: { update: vi.fn() },
      }
      await fn(tx)
      // Verify SponsorPayment was created (not VoucherPurchase)
      expect(tx.sponsorPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'stu1',
          amount: 3700,
          currency: 'CZK',
          paymentType: 'Školné 2026',
          source: 'bankImport',
          importRowId: 'r1',
        }),
      })
      // Verify row marked as APPROVED
      expect(tx.paymentImportRow.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedById: 'u1',
          resultPaymentId: 'sp1',
        }),
      })
      // No remaining rows → import COMPLETED
      expect(tx.paymentImport.update).toHaveBeenCalledWith({
        where: { id: 'imp1' },
        data: { status: 'COMPLETED' },
      })
    })

    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.approved).toBe(1)
  })

  it('approves voucher row with rate calculation', async () => {
    const row = { id: 'r2', ...MOCK_ROW_BASE, studentId: 'stu1', paymentTypeId: 'pt2', amount: 800, status: 'MATCHED' }
    ;(prisma.paymentImportRow.findMany as any).mockResolvedValue([row])

    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        sponsorPayment: { create: vi.fn() },
        voucherPurchase: { create: vi.fn().mockResolvedValue({ id: 'vp1' }) },
        paymentImportRow: { update: vi.fn(), count: vi.fn().mockResolvedValue(2) },
        paymentImport: { update: vi.fn() },
      }
      await fn(tx)
      // Verify VoucherPurchase was created with count = 800/80 = 10
      expect(tx.voucherPurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'stu1',
          amount: 800,
          count: 10,
          donorName: 'Jan Novák',
          source: 'bankImport',
        }),
      })
      // Remaining rows > 0 → import NOT completed
      expect(tx.paymentImport.update).not.toHaveBeenCalled()
    })

    const res = await POST(mockRequest({ rowIds: ['r2'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.approved).toBe(1)
  })

  it('uses manual voucherCount when set', async () => {
    const row = { id: 'r3', ...MOCK_ROW_BASE, studentId: 'stu1', paymentTypeId: 'pt2', amount: 800, status: 'NEW', voucherCount: 5 }
    ;(prisma.paymentImportRow.findMany as any).mockResolvedValue([row])

    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        sponsorPayment: { create: vi.fn() },
        voucherPurchase: { create: vi.fn().mockResolvedValue({ id: 'vp2' }) },
        paymentImportRow: { update: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        paymentImport: { update: vi.fn() },
      }
      await fn(tx)
      expect(tx.voucherPurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ count: 5 }),
      })
    })

    const res = await POST(mockRequest({ rowIds: ['r3'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(200)
  })
})

// ── Split endpoint ─────────────────────────────────

describe('POST /api/payment-imports/[id]/rows/[rowId]/split', () => {
  let POST: (request: any, ctx: any) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getCurrentUser as any).mockResolvedValue(MOCK_USER)
    ;(isManager as any).mockReturnValue(true)
    ;(checkRateLimit as any).mockReturnValue({ success: true })
    ;(prisma.paymentType.findMany as any).mockResolvedValue(MOCK_PAYMENT_TYPES)
    ;(prisma.user.findUnique as any).mockResolvedValue(MOCK_USER)
    ;(prisma.voucherRate.findMany as any).mockResolvedValue([{ currency: 'CZK', rate: 80, isActive: true }])

    const mod = await import('@/app/api/payment-imports/[id]/rows/[rowId]/split/route')
    POST = mod.POST
  })

  const params = { id: 'imp1', rowId: 'r1' }
  const mockRow = { id: 'r1', ...MOCK_ROW_BASE, amount: 1000, status: 'MATCHED', studentId: null, paymentTypeId: null }

  it('returns 401 if not authenticated', async () => {
    ;(getCurrentUser as any).mockResolvedValue(null)
    const res = await POST(mockRequest({ parts: [] }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 429 if rate limited', async () => {
    ;(checkRateLimit as any).mockReturnValue({ success: false, retryAfter: 30 })
    const res = await POST(mockRequest({ parts: [] }), { params })
    expect(res.status).toBe(429)
  })

  it('returns 404 if row not found', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(null)
    const res = await POST(mockRequest({ parts: [{ amount: 500 }, { amount: 500 }] }), { params })
    expect(res.status).toBe(404)
  })

  it('returns 400 if row already approved', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue({ ...mockRow, status: 'APPROVED' })
    const res = await POST(mockRequest({ parts: [{ amount: 500 }, { amount: 500 }] }), { params })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Cannot split')
  })

  it('returns 400 if less than 2 parts', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)
    const res = await POST(mockRequest({ parts: [{ amount: 1000 }] }), { params })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('2-5 parts')
  })

  it('returns 400 if more than 5 parts', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)
    const parts = Array(6).fill({ amount: 166.67 })
    const res = await POST(mockRequest({ parts }), { params })
    expect(res.status).toBe(400)
  })

  it('returns 400 if sum does not match original amount', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)
    const res = await POST(mockRequest({ parts: [{ amount: 600 }, { amount: 500 }] }), { params })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Sum of parts')
    expect(data.expected).toBe(1000)
    expect(data.actual).toBe(1100)
  })

  it('returns 400 if a part has zero amount', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)
    const res = await POST(mockRequest({ parts: [{ amount: 1000 }, { amount: 0 }] }), { params })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('positive amount')
  })

  it('splits without auto-approve when parts lack student/type', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)

    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        paymentImportRow: {
          update: vi.fn(),
          create: vi.fn().mockResolvedValue({ id: 'child1' }),
          count: vi.fn().mockResolvedValue(2),
        },
        paymentImport: { update: vi.fn() },
        sponsorPayment: { create: vi.fn() },
        voucherPurchase: { create: vi.fn() },
      }
      await fn(tx)
      // Original row marked as SPLIT
      expect(tx.paymentImportRow.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'SPLIT' },
      })
      // Two child rows created
      expect(tx.paymentImportRow.create).toHaveBeenCalledTimes(2)
      // No auto-approve → no payment records
      expect(tx.sponsorPayment.create).not.toHaveBeenCalled()
      expect(tx.voucherPurchase.create).not.toHaveBeenCalled()
      // totalRows incremented
      expect(tx.paymentImport.update).toHaveBeenCalledWith({
        where: { id: 'imp1' },
        data: { totalRows: { increment: 2 } },
      })
    })

    const res = await POST(mockRequest({
      parts: [{ amount: 600 }, { amount: 400 }],
    }), { params })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.parts).toBe(2)
    expect(data.approved).toBe(0)
  })

  it('auto-approves parts that have studentId and paymentTypeId', async () => {
    ;(prisma.paymentImportRow.findFirst as any).mockResolvedValue(mockRow)

    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        paymentImportRow: {
          update: vi.fn(),
          create: vi.fn().mockResolvedValue({ id: 'child1' }),
          count: vi.fn().mockResolvedValue(0),
        },
        paymentImport: { update: vi.fn() },
        sponsorPayment: { create: vi.fn().mockResolvedValue({ id: 'sp1' }) },
        voucherPurchase: { create: vi.fn().mockResolvedValue({ id: 'vp1' }) },
      }
      await fn(tx)
      // First part: tuition → SponsorPayment
      expect(tx.sponsorPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'stu1',
          amount: 600,
          paymentType: 'Školné 2026',
        }),
      })
      // Second part: voucher → VoucherPurchase
      expect(tx.voucherPurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'stu2',
          amount: 400,
          count: 5, // 400/80 = 5
        }),
      })
      // All resolved → import completed
      expect(tx.paymentImport.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'COMPLETED' } })
      )
    })

    const res = await POST(mockRequest({
      parts: [
        { amount: 600, studentId: 'stu1', paymentTypeId: 'pt1' },
        { amount: 400, studentId: 'stu2', paymentTypeId: 'pt2' },
      ],
    }), { params })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.approved).toBe(2)
  })
})

// ── Reject endpoint ────────────────────────────────

describe('POST /api/payment-imports/[id]/reject', () => {
  let POST: (request: any, ctx: any) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getCurrentUser as any).mockResolvedValue(MOCK_USER)
    ;(isManager as any).mockReturnValue(true)
    ;(checkRateLimit as any).mockReturnValue({ success: true })
    ;(prisma.user.findUnique as any).mockResolvedValue(MOCK_USER)

    const mod = await import('@/app/api/payment-imports/[id]/reject/route')
    POST = mod.POST
  })

  it('returns 401 if not authenticated', async () => {
    ;(getCurrentUser as any).mockResolvedValue(null)
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 if rowIds is empty', async () => {
    const res = await POST(mockRequest({ rowIds: [] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(400)
  })

  it('rejects rows and returns count', async () => {
    ;(prisma.paymentImportRow.updateMany as any).mockResolvedValue({ count: 2 })
    ;(prisma.paymentImportRow.count as any).mockResolvedValue(1) // still remaining

    const res = await POST(mockRequest({ rowIds: ['r1', 'r2'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.rejected).toBe(2)
    // Import NOT completed (remaining rows)
    expect(prisma.paymentImport.update).not.toHaveBeenCalled()
  })

  it('marks import as COMPLETED when all rows resolved', async () => {
    ;(prisma.paymentImportRow.updateMany as any).mockResolvedValue({ count: 1 })
    ;(prisma.paymentImportRow.count as any).mockResolvedValue(0)

    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(200)
    expect(prisma.paymentImport.update).toHaveBeenCalledWith({
      where: { id: 'imp1' },
      data: { status: 'COMPLETED' },
    })
  })

  it('returns 429 if rate limited', async () => {
    ;(checkRateLimit as any).mockReturnValue({ success: false, retryAfter: 30 })
    const res = await POST(mockRequest({ rowIds: ['r1'] }), { params: { id: 'imp1' } })
    expect(res.status).toBe(429)
  })
})
