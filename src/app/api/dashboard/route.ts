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
      totalPaymentsResult,
      activeSponsors,
      recentPayments,
      unfulfilledNeeds,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'SPONSOR', isActive: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.sponsorship.count({ where: { isActive: true } }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: { student: { select: { firstName: true, lastName: true, studentNo: true } } },
      }),
      prisma.need.count({ where: { isFulfilled: false } }),
    ])

    return NextResponse.json({
      stats: {
        totalStudents,
        totalSponsors,
        totalPayments: totalPaymentsResult._sum.amount || 0,
        activeSponsors,
        unfulfilledNeeds,
      },
      recentPayments,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
