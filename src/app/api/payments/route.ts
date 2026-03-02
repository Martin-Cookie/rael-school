import { NextRequest, NextResponse } from 'next/server'
import { prisma, isNotFoundError } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { recalcTuitionStatus, isTuitionType } from '@/lib/tuition'

// GET /api/payments — list all payments with students and sponsors
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [sponsorPayments, voucherPurchases, students, sponsors] = await Promise.all([
      prisma.sponsorPayment.findMany({
        take: 1000,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.voucherPurchase.findMany({
        take: 1000,
        orderBy: { purchaseDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNo: true } },
          sponsor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
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
    ])

    return NextResponse.json({ sponsorPayments, voucherPurchases, students, sponsors })
  } catch (error) {
    console.error('GET /api/payments error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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
      // Přepočítat stav předpisu pokud jde o školné
      if (isTuitionType(paymentType)) {
        await recalcTuitionStatus(studentId)
      }
      return NextResponse.json({ payment }, { status: 201 })
    }

    if (type === 'voucher') {
      const { studentId, purchaseDate, amount, currency, count, donorName, sponsorId, notes } = body
      if (!studentId || !purchaseDate || !amount || !count) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const voucher = await prisma.voucherPurchase.create({
        data: {
          studentId,
          purchaseDate: new Date(purchaseDate),
          amount: parseFloat(amount),
          currency: currency || 'KES',
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
      // Načíst starou platbu pro recalc (může se měnit student/typ)
      const oldPayment = await prisma.sponsorPayment.findUnique({ where: { id } })
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
      // Přepočítat pro starého i nového studenta pokud jde o školné
      const affectedStudents = new Set<string>()
      if (oldPayment && isTuitionType(oldPayment.paymentType)) affectedStudents.add(oldPayment.studentId)
      if (isTuitionType(payment.paymentType)) affectedStudents.add(payment.studentId)
      for (const sid of affectedStudents) {
        await recalcTuitionStatus(sid)
      }
      return NextResponse.json({ payment })
    }

    if (type === 'voucher') {
      const { studentId, purchaseDate, amount, currency, count, donorName, sponsorId, notes } = body
      const voucher = await prisma.voucherPurchase.update({
        where: { id },
        data: {
          studentId: studentId || undefined,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          amount: amount ? parseFloat(amount) : undefined,
          currency: currency || undefined,
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
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
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
      // Načíst platbu před smazáním pro recalc
      const payment = await prisma.sponsorPayment.findUnique({ where: { id } })
      await prisma.sponsorPayment.delete({ where: { id } })
      // Přepočítat stav předpisu pokud šlo o školné
      if (payment && isTuitionType(payment.paymentType)) {
        await recalcTuitionStatus(payment.studentId)
      }
      return NextResponse.json({ success: true })
    }

    if (type === 'voucher') {
      await prisma.voucherPurchase.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    console.error('DELETE /api/payments error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
