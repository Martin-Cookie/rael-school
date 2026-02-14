import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

// GET /api/payment-imports/[id] — detail with all rows
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentImport = await prisma.paymentImport.findUnique({
      where: { id: params.id },
      include: {
        importedBy: { select: { firstName: true, lastName: true } },
        rows: {
          orderBy: { transactionDate: 'asc' },
          include: {
            sponsor: { select: { id: true, firstName: true, lastName: true } },
            student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
            splitRows: {
              select: { id: true, amount: true, status: true, studentId: true, paymentTypeId: true },
            },
          },
        },
      },
    })

    if (!paymentImport) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 })
    }

    // Compute statistics
    const stats = {
      total: paymentImport.rows.length,
      matched: paymentImport.rows.filter((r) => r.status === 'MATCHED').length,
      partial: paymentImport.rows.filter((r) => r.status === 'PARTIAL').length,
      new: paymentImport.rows.filter((r) => r.status === 'NEW').length,
      duplicate: paymentImport.rows.filter((r) => r.status === 'DUPLICATE').length,
      approved: paymentImport.rows.filter((r) => r.status === 'APPROVED').length,
      rejected: paymentImport.rows.filter((r) => r.status === 'REJECTED').length,
      split: paymentImport.rows.filter((r) => r.status === 'SPLIT').length,
    }

    return NextResponse.json({ import: paymentImport, stats })
  } catch (error) {
    console.error('GET /api/payment-imports/[id] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/payment-imports/[id] — cancel import (only if no APPROVED rows)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentImport = await prisma.paymentImport.findUnique({
      where: { id: params.id },
      include: {
        rows: { select: { status: true } },
      },
    })

    if (!paymentImport) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 })
    }

    // Check for approved rows
    const hasApproved = paymentImport.rows.some((r) => r.status === 'APPROVED')
    if (hasApproved) {
      return NextResponse.json({
        error: 'Cannot cancel — contains approved payments',
      }, { status: 400 })
    }

    // Delete import (rows cascade)
    await prisma.paymentImport.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/payment-imports/[id] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
