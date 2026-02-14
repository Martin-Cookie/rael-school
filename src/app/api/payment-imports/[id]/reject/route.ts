import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

// POST /api/payment-imports/[id]/reject — bulk reject rows
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({ rejected: result.count })
  } catch (error) {
    console.error('POST /api/payment-imports/[id]/reject error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
