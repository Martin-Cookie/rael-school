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
      tuitionCharges,
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
        take: 100,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.voucherPurchase.findMany({
        take: 100,
        orderBy: { purchaseDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.tuitionCharge.findMany({
        take: 100,
        include: {
          student: { select: { id: true, studentNo: true, firstName: true, lastName: true, className: true } },
        },
        orderBy: [{ period: 'desc' }, { student: { lastName: 'asc' } }],
      }),
    ])

    // Server-side aggregation using groupBy/aggregate (not loading all records)
    const [spAgg, vpAgg, tcAgg] = await Promise.all([
      prisma.sponsorPayment.groupBy({
        by: ['currency'],
        _sum: { amount: true },
      }),
      prisma.voucherPurchase.aggregate({
        _sum: { amount: true },
      }),
      prisma.tuitionCharge.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const sponsorPaymentsByCurrency: Record<string, number> = {}
    for (const g of spAgg) {
      sponsorPaymentsByCurrency[g.currency] = g._sum.amount || 0
    }

    const voucherTotalAmount = vpAgg._sum.amount || 0

    const tuitionTotalCharged = tcAgg.reduce((s, g) => s + (g._sum.amount || 0), 0)
    const tuitionPaidCount = tcAgg.find(g => g.status === 'PAID')?._count || 0
    const tuitionPartialCount = tcAgg.find(g => g.status === 'PARTIAL')?._count || 0
    const tuitionUnpaidCount = tcAgg.find(g => g.status === 'UNPAID')?._count || 0
    const tuitionTotalCharges = tcAgg.reduce((s, g) => s + g._count, 0)

    return NextResponse.json({
      stats: {
        totalStudents,
        totalSponsors,
        totalPayments: 0,
        activeSponsors,
        unfulfilledNeeds,
        sponsorPaymentsByCurrency,
        voucherTotalAmount,
        tuitionTotalCharged,
        tuitionTotalCharges,
        tuitionPaidCount,
        tuitionPartialCount,
        tuitionUnpaidCount,
      },
      recentPayments,
      sponsorPayments,
      voucherPurchases,
      tuitionCharges,
      students,
      sponsors,
      studentsWithNeeds,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
