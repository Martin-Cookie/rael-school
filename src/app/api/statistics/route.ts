import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
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
    })

    const voucherStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      purchased: s.vouchers.reduce((sum, v) => sum + v.count, 0),
      used: s.voucherUsages.reduce((sum, v) => sum + v.count, 0),
    }))

    return NextResponse.json({ voucherStats })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
