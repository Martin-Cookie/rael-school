import { NextRequest, NextResponse } from 'next/server'
import { prisma, isNotFoundError } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = checkRateLimit(`student-detail-write:${user.id}`, 30, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { id: studentId } = params
    const data = await request.json()

    const payment = await prisma.sponsorPayment.create({
      data: {
        studentId,
        sponsorId: data.sponsorId || null,
        paymentDate: new Date(data.paymentDate),
        amount: parseFloat(data.amount),
        currency: data.currency || 'KES',
        paymentType: data.paymentType,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsor payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = checkRateLimit(`student-detail-write:${user.id}`, 30, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { paymentId } = await request.json()
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    await prisma.sponsorPayment.delete({ where: { id: paymentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    console.error('Error deleting sponsor payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
