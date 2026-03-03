import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { logAudit } from '@/lib/auditLog'

// POST /api/payment-imports/[id]/reject — bulk reject rows
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jwtUser = await getCurrentUser()
    if (!jwtUser || !isManager(jwtUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = checkRateLimit(`import-ops:${jwtUser.id}`, 10, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    // Look up user in DB by email (JWT may have stale id after re-seed)
    const user = await prisma.user.findUnique({ where: { email: jwtUser.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { rowIds } = await request.json()
    if (!Array.isArray(rowIds) || rowIds.length === 0) {
      return NextResponse.json({ error: 'No rows selected' }, { status: 400 })
    }

    const result = await prisma.paymentImportRow.updateMany({
      where: {
        id: { in: rowIds },
        importId: params.id,
        status: { notIn: ['APPROVED', 'REJECTED'] },
      },
      data: {
        status: 'REJECTED',
        approvedById: user.id,
        approvedAt: new Date(),
      },
    })

    // Check if all rows are now resolved → mark import as COMPLETED
    const remainingRows = await prisma.paymentImportRow.count({
      where: {
        importId: params.id,
        status: { in: ['NEW', 'MATCHED', 'PARTIAL'] },
      },
    })

    if (remainingRows === 0) {
      await prisma.paymentImport.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      })
    }

    await logAudit({ userId: user.id, userEmail: user.email, action: 'REJECT', resource: 'PaymentImport', resourceId: params.id })

    return NextResponse.json({ rejected: result.count })
  } catch (error) {
    console.error('POST /api/payment-imports/[id]/reject error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
