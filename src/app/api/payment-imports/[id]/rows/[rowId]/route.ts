import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

// PUT /api/payment-imports/[id]/rows/[rowId] — edit row (sponsor, student, paymentType)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; rowId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const row = await prisma.paymentImportRow.findFirst({
      where: { id: params.rowId, importId: params.id },
    })

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 })
    }

    // Don't allow editing approved/rejected rows
    if (['APPROVED', 'REJECTED'].includes(row.status)) {
      return NextResponse.json({ error: 'Cannot edit approved/rejected row' }, { status: 400 })
    }

    const body = await request.json()
    const { sponsorId, studentId, paymentTypeId } = body

    // Determine new status based on what's filled
    let newStatus = row.status
    if (row.status !== 'DUPLICATE' && row.status !== 'SPLIT') {
      const hasSponsor = sponsorId !== undefined ? !!sponsorId : !!row.sponsorId
      const hasStudent = studentId !== undefined ? !!studentId : !!row.studentId
      const hasType = paymentTypeId !== undefined ? !!paymentTypeId : !!row.paymentTypeId

      if (hasSponsor && hasStudent && hasType) {
        newStatus = 'MATCHED'
      } else if (hasSponsor || hasStudent || hasType) {
        newStatus = 'PARTIAL'
      } else {
        newStatus = 'NEW'
      }
    }

    const updated = await prisma.paymentImportRow.update({
      where: { id: params.rowId },
      data: {
        ...(sponsorId !== undefined && { sponsorId: sponsorId || null }),
        ...(studentId !== undefined && { studentId: studentId || null }),
        ...(paymentTypeId !== undefined && { paymentTypeId: paymentTypeId || null }),
        status: newStatus,
        matchConfidence: 'HIGH', // Manual edit = high confidence
        matchNotes: row.matchNotes
          ? `${row.matchNotes}; Ručně upraveno`
          : 'Ručně upraveno',
      },
      include: {
        sponsor: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
      },
    })

    return NextResponse.json({ row: updated })
  } catch (error) {
    console.error('PUT /api/payment-imports/[id]/rows/[rowId] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
