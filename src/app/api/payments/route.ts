import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

// POST /api/payments — create sponsor payment or voucher purchase
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body // 'sponsor' or 'voucher'

    if (type === 'sponsor') {
      const { studentId, sponsorId, paymentDate, amount, currency, paymentType, notes } = body
      if (!studentId || !paymentDate || !amount || !paymentType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const payment = await prisma.sponsorPayment.create({
        data: {
          studentId,
          sponsorId: sponsorId || null,
          paymentDate: new Date(paymentDate),
          amount: parseFloat(amount),
          currency: currency || 'KES',
          paymentType,
          notes: notes || null,
        },
      })
      return NextResponse.json({ payment }, { status: 201 })
    }

    if (type === 'voucher') {
      const { studentId, purchaseDate, amount, count, donorName, sponsorId, notes } = body
      if (!studentId || !purchaseDate || !amount || !count) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const voucher = await prisma.voucherPurchase.create({
        data: {
          studentId,
          purchaseDate: new Date(purchaseDate),
          amount: parseFloat(amount),
          count: parseInt(count),
          donorName: donorName || null,
          sponsorId: sponsorId || null,
          notes: notes || null,
        },
      })
      return NextResponse.json({ voucher }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/payments error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT /api/payments — update sponsor payment or voucher purchase
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    if (type === 'sponsor') {
      const { studentId, sponsorId, paymentDate, amount, currency, paymentType, notes } = body
      const payment = await prisma.sponsorPayment.update({
        where: { id },
        data: {
          studentId: studentId || undefined,
          sponsorId: sponsorId || null,
          paymentDate: paymentDate ? new Date(paymentDate) : undefined,
          amount: amount ? parseFloat(amount) : undefined,
          currency: currency || undefined,
          paymentType: paymentType || undefined,
          notes: notes ?? undefined,
        },
      })
      return NextResponse.json({ payment })
    }

    if (type === 'voucher') {
      const { studentId, purchaseDate, amount, count, donorName, sponsorId, notes } = body
      const voucher = await prisma.voucherPurchase.update({
        where: { id },
        data: {
          studentId: studentId || undefined,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          amount: amount ? parseFloat(amount) : undefined,
          count: count ? parseInt(count) : undefined,
          donorName: donorName ?? undefined,
          sponsorId: sponsorId !== undefined ? (sponsorId || null) : undefined,
          notes: notes ?? undefined,
        },
      })
      return NextResponse.json({ voucher })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('PUT /api/payments error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/payments — delete sponsor payment or voucher purchase
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    if (type === 'sponsor') {
      await prisma.sponsorPayment.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'voucher') {
      await prisma.voucherPurchase.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('DELETE /api/payments error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
