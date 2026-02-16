import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'

// POST /api/payment-imports/[id]/approve — bulk approve rows
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jwtUser = await getCurrentUser()
    if (!jwtUser || !isManager(jwtUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up user in DB by email (JWT may have stale id after re-seed)
    const user = await prisma.user.findUnique({ where: { email: jwtUser.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { rowIds } = await request.json()
    if (!Array.isArray(rowIds) || rowIds.length === 0) {
      return NextResponse.json({ error: 'No rows selected' }, { status: 400 })
    }

    // Load rows with their payment type info
    const rows = await prisma.paymentImportRow.findMany({
      where: {
        id: { in: rowIds },
        importId: params.id,
        status: { in: ['MATCHED', 'PARTIAL', 'NEW'] },
      },
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No approvable rows found' }, { status: 400 })
    }

    // Validate: all rows must have studentId and paymentTypeId
    const incomplete = rows.filter(r => !r.studentId || !r.paymentTypeId)
    if (incomplete.length > 0) {
      return NextResponse.json({
        error: `${incomplete.length} rows missing student or payment type`,
        incompleteRowIds: incomplete.map(r => r.id),
      }, { status: 400 })
    }

    // Load payment types to determine which are vouchers
    const allPaymentTypes = await prisma.paymentType.findMany()
    const voucherTypeIds = allPaymentTypes
      .filter(pt => pt.name.toLowerCase().includes('stravenk') || pt.name.toLowerCase().includes('voucher'))
      .map(pt => pt.id)

    // Pre-load sponsor names for donorName on VoucherPurchase
    const sponsorIds = [...new Set(rows.map(r => r.sponsorId).filter(Boolean))] as string[]
    const sponsorUsers = sponsorIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: sponsorIds } }, select: { id: true, firstName: true, lastName: true } })
      : []
    const sponsorNameMap = new Map(sponsorUsers.map(s => [s.id, `${s.firstName} ${s.lastName}`]))

    let approvedCount = 0

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const isVoucher = row.paymentTypeId && voucherTypeIds.includes(row.paymentTypeId)

        let resultPaymentId: string

        if (isVoucher) {
          // Create VoucherPurchase — use manually set count, fallback to calculation
          const voucherCount = row.voucherCount || Math.floor(row.amount / 80)
          const vp = await tx.voucherPurchase.create({
            data: {
              studentId: row.studentId!,
              purchaseDate: row.transactionDate,
              amount: row.amount,
              count: voucherCount || 1,
              sponsorId: row.sponsorId,
              donorName: row.sponsorId ? sponsorNameMap.get(row.sponsorId) || null : null,
              source: 'bankImport',
              importRowId: row.id,
            },
          })
          resultPaymentId = vp.id
        } else {
          // Create SponsorPayment
          const paymentType = allPaymentTypes.find(pt => pt.id === row.paymentTypeId)
          const sp = await tx.sponsorPayment.create({
            data: {
              studentId: row.studentId!,
              sponsorId: row.sponsorId,
              paymentDate: row.transactionDate,
              amount: row.amount,
              currency: row.currency,
              paymentType: paymentType?.name || 'other',
              source: 'bankImport',
              importRowId: row.id,
            },
          })
          resultPaymentId = sp.id
        }

        // Update row status
        await tx.paymentImportRow.update({
          where: { id: row.id },
          data: {
            status: 'APPROVED',
            approvedById: user.id,
            approvedAt: new Date(),
            resultPaymentId,
          },
        })

        approvedCount++
      }

      // Check if all rows are now resolved → mark import as COMPLETED
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
    })

    return NextResponse.json({ approved: approvedCount })
  } catch (error) {
    console.error('POST /api/payment-imports/[id]/approve error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
