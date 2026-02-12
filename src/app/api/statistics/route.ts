import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [students, paymentTypes, sponsorPayments] = await Promise.all([
      prisma.student.findMany({
        where: { isActive: true },
        select: {
          id: true,
          studentNo: true,
          firstName: true,
          lastName: true,
          className: true,
          vouchers: { select: { count: true } },
          voucherUsages: { select: { count: true } },
        },
        orderBy: { lastName: 'asc' },
      }),
      prisma.paymentType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.sponsorPayment.findMany({
        select: {
          studentId: true,
          paymentType: true,
          amount: true,
          currency: true,
        },
      }),
    ])

    const voucherStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      purchased: s.vouchers.reduce((sum, v) => sum + v.count, 0),
      used: s.voucherUsages.reduce((sum, v) => sum + v.count, 0),
    }))

    // Group sponsor payments by studentId and paymentType
    const paymentsByStudent: Record<string, Record<string, { total: number; currency: string }>> = {}
    sponsorPayments.forEach(p => {
      if (!paymentsByStudent[p.studentId]) paymentsByStudent[p.studentId] = {}
      if (!paymentsByStudent[p.studentId][p.paymentType]) {
        paymentsByStudent[p.studentId][p.paymentType] = { total: 0, currency: p.currency }
      }
      paymentsByStudent[p.studentId][p.paymentType].total += p.amount
    })

    const sponsorPaymentStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      payments: paymentsByStudent[s.id] || {},
    }))

    return NextResponse.json({ voucherStats, sponsorPaymentStats, paymentTypes })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
