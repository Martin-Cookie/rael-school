import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
    const data = await request.json()

    if (data.type === 'purchase') {
      const purchase = await prisma.voucherPurchase.create({
        data: {
          studentId,
          purchaseDate: new Date(data.date),
          amount: parseFloat(data.amount),
          currency: data.currency || 'CZK',
          count: parseInt(data.count),
          donorName: data.donorName || null,
          sponsorId: data.sponsorId || null,
          notes: data.notes || null,
          source: 'manual',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { voucherId, type } = data

    if (!voucherId || !type) {
      return NextResponse.json({ error: 'voucherId and type required' }, { status: 400 })
    }

    if (type === 'purchase') {
      await prisma.voucherPurchase.delete({ where: { id: voucherId } })
    } else if (type === 'usage') {
      await prisma.voucherUsage.delete({ where: { id: voucherId } })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
