import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tuitionRates = await prisma.tuitionRate.findMany({
      where: { isActive: true },
      orderBy: { gradeFrom: 'asc' },
    })
    return NextResponse.json({ tuitionRates })
  } catch (error) {
    console.error('Error fetching tuition rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
