import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalStudents,
      totalSponsors,
      activeSponsors,
      recentPayments,
      unfulfilledNeeds,
      students,
      sponsors,
      studentsWithNeeds,
      sponsorPayments,
      voucherPurchases,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'SPONSOR', isActive: true } }),
      prisma.sponsorship.count({ where: { isActive: true } }),
      prisma.payment.findMany({
        take: 50,
        orderBy: { paymentDate: 'desc' },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentNo: true } } },
      }),
      prisma.need.count({ where: { isFulfilled: false } }),
      prisma.student.findMany({
        where: { isActive: true },
        select: {
          id: true, studentNo: true, firstName: true, lastName: true,
          className: true, dateOfBirth: true, gender: true,
          _count: { select: { needs: { where: { isFulfilled: false } }, sponsorships: { where: { isActive: true } } } },
        },
        orderBy: { lastName: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'SPONSOR', isActive: true },
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          sponsorships: {
            where: { isActive: true },
            select: { student: { select: { id: true, firstName: true, lastName: true, studentNo: true } } },
          },
        },
        orderBy: { lastName: 'asc' },
      }),
      prisma.student.findMany({
        where: { isActive: true, needs: { some: { isFulfilled: false } } },
        select: {
          id: true, studentNo: true, firstName: true, lastName: true, className: true,
          needs: { where: { isFulfilled: false }, select: { id: true, description: true } },
        },
        orderBy: { lastName: 'asc' },
      }),
      prisma.sponsorPayment.findMany({
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.voucherPurchase.findMany({
        orderBy: { purchaseDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ])

    // Aggregate sponsor payments by currency
    const sponsorPaymentsByCurrency: Record<string, number> = {}
    sponsorPayments.forEach((p: any) => {
      const cur = p.currency || 'KES'
      sponsorPaymentsByCurrency[cur] = (sponsorPaymentsByCurrency[cur] || 0) + p.amount
    })

    // Aggregate voucher purchases by currency (vouchers don't have currency field, use KES as default)
    const voucherTotalAmount = voucherPurchases.reduce((sum: number, v: any) => sum + v.amount, 0)

    return NextResponse.json({
      stats: {
        totalStudents,
        totalSponsors,
        totalPayments: 0,
        activeSponsors,
        unfulfilledNeeds,
        sponsorPaymentsByCurrency,
        voucherTotalAmount,
      },
      recentPayments,
      sponsorPayments,
      voucherPurchases,
      students,
      sponsors,
      studentsWithNeeds,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
