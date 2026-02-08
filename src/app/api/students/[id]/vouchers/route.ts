import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = params
    const data = await request.json()

    if (data.type === 'purchase') {
      const purchase = await prisma.voucherPurchase.create({
        data: {
          studentId,
          purchaseDate: new Date(data.date),
          amount: parseFloat(data.amount),
          count: parseInt(data.count),
          notes: data.notes || null,
        },
      })
      return NextResponse.json({ purchase }, { status: 201 })
    } else if (data.type === 'usage') {
      const usage = await prisma.voucherUsage.create({
        data: {
          studentId,
          usageDate: new Date(data.date),
          count: parseInt(data.count),
          notes: data.notes || null,
        },
      })
      return NextResponse.json({ usage }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error creating voucher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
