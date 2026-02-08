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
      students,
      sponsors,
      studentsWithNeeds,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'SPONSOR', isActive: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.sponsorship.count({ where: { isActive: true } }),
      prisma.payment.findMany({
        take: 50,
        orderBy: { paymentDate: 'desc' },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentNo: true } } },
      }),
      prisma.need.count({ where: { isFulfilled: false } }),
      // All students for the students tab
      prisma.student.findMany({
        where: { isActive: true },
        select: {
          id: true, studentNo: true, firstName: true, lastName: true,
          className: true, dateOfBirth: true, gender: true,
          _count: { select: { needs: { where: { isFulfilled: false } }, sponsorships: { where: { isActive: true } } } },
        },
        orderBy: { lastName: 'asc' },
      }),
      // All sponsors
      prisma.user.findMany({
        where: { role: 'SPONSOR', isActive: true },
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          sponsorships: {
            where: { isActive: true },
            select: { student: { select: { firstName: true, lastName: true, studentNo: true } } },
          },
        },
        orderBy: { lastName: 'asc' },
      }),
      // Students with unfulfilled needs
      prisma.student.findMany({
        where: { isActive: true, needs: { some: { isFulfilled: false } } },
        select: {
          id: true, studentNo: true, firstName: true, lastName: true, className: true,
          needs: { where: { isFulfilled: false }, select: { id: true, description: true } },
        },
        orderBy: { lastName: 'asc' },
      }),
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
      students,
      sponsors,
      studentsWithNeeds,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
