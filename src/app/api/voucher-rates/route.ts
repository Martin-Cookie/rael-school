import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const voucherRates = await prisma.voucherRate.findMany({
      where: { isActive: true },
      orderBy: { currency: 'asc' },
    })
    return NextResponse.json({ voucherRates })
  } catch (error) {
    console.error('Error fetching voucher rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
