import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

interface SplitPart {
  amount: number
  studentId?: string
  paymentTypeId?: string
  count?: number
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

    // Load payment types for auto-approve (voucher detection)
    const allPaymentTypes = await prisma.paymentType.findMany()
    const voucherTypeIds = allPaymentTypes
      .filter(pt => pt.name.toLowerCase().includes('stravenk') || pt.name.toLowerCase().includes('voucher'))
      .map(pt => pt.id)

    // Look up user in DB for approvedById
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })

    // Look up sponsor name for donorName on VoucherPurchase
    let sponsorName: string | null = null
    if (row.sponsorId) {
      const sponsor = await prisma.user.findUnique({
        where: { id: row.sponsorId },
        select: { firstName: true, lastName: true },
      })
      if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`
    }

    let approvedCount = 0

    await prisma.$transaction(async (tx) => {
      // Mark original row as SPLIT
      await tx.paymentImportRow.update({
        where: { id: params.rowId },
        data: { status: 'SPLIT' },
      })

      // Create child rows + auto-approve if fully matched
      for (const part of parts) {
        const hasSponsor = !!row.sponsorId
        const hasStudent = !!part.studentId
        const hasType = !!part.paymentTypeId
        const canAutoApprove = hasStudent && hasType

        let status = 'NEW'
        if (canAutoApprove) {
          status = 'APPROVED'
        } else if (hasSponsor && hasStudent && hasType) {
          status = 'MATCHED'
        } else if (hasSponsor || hasStudent || hasType) {
          status = 'PARTIAL'
        }

        const childRow = await tx.paymentImportRow.create({
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
            ...(canAutoApprove && dbUser && {
              approvedById: dbUser.id,
              approvedAt: new Date(),
            }),
          },
        })

        // Auto-approve: create actual payment record
        if (canAutoApprove && part.studentId && part.paymentTypeId) {
          const isVoucher = voucherTypeIds.includes(part.paymentTypeId)
          let resultPaymentId: string

          if (isVoucher) {
            const voucherCount = part.count && part.count > 0 ? part.count : Math.floor(part.amount / 80)
            const vp = await tx.voucherPurchase.create({
              data: {
                studentId: part.studentId,
                purchaseDate: row.transactionDate,
                amount: part.amount,
                count: voucherCount || 1,
                sponsorId: row.sponsorId,
                donorName: sponsorName,
                source: 'bankImport',
                importRowId: childRow.id,
              },
            })
            resultPaymentId = vp.id
          } else {
            const paymentType = allPaymentTypes.find(pt => pt.id === part.paymentTypeId)
            const sp = await tx.sponsorPayment.create({
              data: {
                studentId: part.studentId,
                sponsorId: row.sponsorId,
                paymentDate: row.transactionDate,
                amount: part.amount,
                currency: row.currency,
                paymentType: paymentType?.name || 'other',
                source: 'bankImport',
                importRowId: childRow.id,
              },
            })
            resultPaymentId = sp.id
          }

          await tx.paymentImportRow.update({
            where: { id: childRow.id },
            data: { resultPaymentId },
          })

          approvedCount++
        }
      }

      // Update total rows count
      await tx.paymentImport.update({
        where: { id: params.id },
        data: {
          totalRows: { increment: parts.length },
        },
      })

      // Check if all rows are resolved after auto-approve
      if (approvedCount > 0) {
        const remainingRows = await tx.paymentImportRow.count({
          where: {
            importId: params.id,
            status: { in: ['NEW', 'MATCHED', 'PARTIAL'] },
          },
        })
        if (remainingRows === 0) {
          await tx.paymentImport.update({
            where: { id: params.id },
            data: { status: 'COMPLETED' },
          })
        }
      }
    })

    return NextResponse.json({ success: true, parts: parts.length, approved: approvedCount })
  } catch (error) {
    console.error('POST /api/payment-imports/[id]/rows/[rowId]/split error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
