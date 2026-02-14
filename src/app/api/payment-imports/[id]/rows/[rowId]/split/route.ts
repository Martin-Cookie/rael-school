import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

interface SplitPart {
  amount: number
  studentId?: string
  paymentTypeId?: string
}

// POST /api/payment-imports/[id]/rows/[rowId]/split — split a row into parts
export async function POST(
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

    if (['APPROVED', 'REJECTED', 'SPLIT'].includes(row.status)) {
      return NextResponse.json({ error: 'Cannot split this row' }, { status: 400 })
    }

    const { parts } = await request.json() as { parts: SplitPart[] }

    if (!Array.isArray(parts) || parts.length < 2 || parts.length > 5) {
      return NextResponse.json({ error: 'Must have 2-5 parts' }, { status: 400 })
    }

    // Validate: sum of parts must equal original amount
    const sum = parts.reduce((s, p) => s + (p.amount || 0), 0)
    const diff = Math.abs(sum - row.amount)
    if (diff > 0.01) {
      return NextResponse.json({
        error: 'Sum of parts must equal original amount',
        expected: row.amount,
        actual: sum,
      }, { status: 400 })
    }

    // Validate: all parts must have amount > 0
    if (parts.some(p => !p.amount || p.amount <= 0)) {
      return NextResponse.json({ error: 'All parts must have positive amount' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Mark original row as SPLIT
      await tx.paymentImportRow.update({
        where: { id: params.rowId },
        data: { status: 'SPLIT' },
      })

      // Create child rows
      for (const part of parts) {
        const hasSponsor = !!row.sponsorId
        const hasStudent = !!part.studentId
        const hasType = !!part.paymentTypeId

        let status = 'NEW'
        if (hasSponsor && hasStudent && hasType) status = 'MATCHED'
        else if (hasSponsor || hasStudent || hasType) status = 'PARTIAL'

        await tx.paymentImportRow.create({
          data: {
            importId: params.id,
            transactionDate: row.transactionDate,
            amount: part.amount,
            currency: row.currency,
            variableSymbol: row.variableSymbol,
            senderName: row.senderName,
            senderAccount: row.senderAccount,
            message: row.message,
            rawData: row.rawData,
            status,
            sponsorId: row.sponsorId,
            studentId: part.studentId || null,
            paymentTypeId: part.paymentTypeId || null,
            matchConfidence: 'HIGH',
            matchNotes: 'Vytvořeno rozdělením platby',
            parentRowId: params.rowId,
          },
        })
      }

      // Update total rows count
      await tx.paymentImport.update({
        where: { id: params.id },
        data: {
          totalRows: { increment: parts.length },
        },
      })
    })

    return NextResponse.json({ success: true, parts: parts.length })
  } catch (error) {
    console.error('POST /api/payment-imports/[id]/rows/[rowId]/split error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
