import { NextRequest, NextResponse } from 'next/server'
import { prisma, isNotFoundError } from '@/lib/db'
import { getCurrentUser, isAdmin, isManager } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

// GET — seznam předpisů (s filtrováním podle období)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const studentId = searchParams.get('studentId')

    const where: Record<string, any> = {}
    if (period) where.period = period
    if (studentId) where.studentId = studentId

    const charges = await prisma.tuitionCharge.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentNo: true,
            firstName: true,
            lastName: true,
            className: true,
          },
        },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
    })

    // Pro každý předpis spočítat zaplaceno z SponsorPayment (typ školné)
    const paymentTypes = await prisma.paymentType.findMany({
      where: { isActive: true },
    })
    const tuitionTypeIds = paymentTypes
      .filter(pt => /školné|tuition|karo/i.test(pt.name + (pt.nameEn || '') + (pt.nameSw || '')))
      .map(pt => pt.name)

    // Načíst sazby a třídy pro určení názvu sazby
    const rates = await prisma.tuitionRate.findMany({ where: { isActive: true } })
    const classRooms = await prisma.classRoom.findMany({ where: { isActive: true } })
    const classNameToSortOrder = new Map(classRooms.map(c => [c.name, c.sortOrder]))

    // Batch-load: všechny platby školného jedním dotazem (místo N+1)
    const uniqueStudentIds = [...new Set(charges.map(c => c.studentId))]
    const allTuitionPayments = tuitionTypeIds.length > 0 ? await prisma.sponsorPayment.findMany({
      where: {
        studentId: { in: uniqueStudentIds },
        paymentType: { in: tuitionTypeIds },
      },
      select: {
        amount: true,
        paymentType: true,
        paymentDate: true,
        studentId: true,
        currency: true,
        sponsorId: true,
        sponsor: { select: { id: true, firstName: true, lastName: true } },
      },
    }) : []

    // Pre-index platby do Map pro O(1) lookup místo O(n²) filter
    const paymentIndex = new Map<string, typeof allTuitionPayments>()
    for (const p of allTuitionPayments) {
      const key = `${p.studentId}_${p.currency}`
      if (!paymentIndex.has(key)) paymentIndex.set(key, [])
      paymentIndex.get(key)!.push(p)
    }

    const chargesWithPaid = charges.map((charge) => {
      const year = charge.period.split('-')[0]
      const startDate = new Date(`${year}-01-01T00:00:00Z`)
      const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`)

      // O(1) lookup + filtr jen na rok (malá podmnožina)
      const key = `${charge.studentId}_${charge.currency}`
      const payments = (paymentIndex.get(key) || []).filter(p =>
        p.paymentDate >= startDate && p.paymentDate < endDate
      )

      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)

      const sortOrder = classNameToSortOrder.get(charge.student?.className || '')
      const matchedRate = sortOrder !== undefined
        ? rates.find(r => sortOrder >= r.gradeFrom && sortOrder <= r.gradeTo)
        : undefined

      return {
        ...charge,
        rateName: matchedRate?.name || null,
        rateNameEn: matchedRate?.nameEn || null,
        rateNameSw: matchedRate?.nameSw || null,
        paidAmount,
        remainingAmount: Math.max(0, charge.amount - paidAmount),
        payments,
      }
    })

    // Souhrn
    const totalCharged = chargesWithPaid.reduce((sum, c) => sum + c.amount, 0)
    const totalPaid = chargesWithPaid.reduce((sum, c) => sum + c.paidAmount, 0)

    return NextResponse.json({
      charges: chargesWithPaid,
      summary: { totalCharged, totalPaid, totalRemaining: Math.max(0, totalCharged - totalPaid) },
    })
  } catch (error) {
    console.error('Error fetching tuition charges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — generovat předpisy pro období
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = checkRateLimit(`tuition-charges:${user.id}`, 20, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { period, studentIds } = await request.json()
    if (!period?.trim()) return NextResponse.json({ error: 'Period is required' }, { status: 400 })

    // Načíst sazby školného
    const rates = await prisma.tuitionRate.findMany({ where: { isActive: true } })
    if (rates.length === 0) return NextResponse.json({ error: 'No tuition rates configured' }, { status: 400 })

    // Načíst třídy pro mapování sortOrder
    const classRooms = await prisma.classRoom.findMany({ where: { isActive: true } })
    const classNameToSortOrder = new Map(classRooms.map(c => [c.name, c.sortOrder]))

    // Načíst aktivní studenty (volitelně jen vybrané)
    const studentWhere: Record<string, any> = { isActive: true }
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      studentWhere.id = { in: studentIds }
    }
    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, className: true },
    })

    // Zjistit, kteří studenti už mají předpis pro toto období
    const existingCharges = await prisma.tuitionCharge.findMany({
      where: { period: period.trim() },
      select: { studentId: true },
    })
    const existingStudentIds = new Set(existingCharges.map(c => c.studentId))

    let created = 0
    let skipped = 0

    for (const student of students) {
      if (existingStudentIds.has(student.id)) {
        skipped++
        continue
      }

      const sortOrder = classNameToSortOrder.get(student.className || '')
      if (sortOrder === undefined) {
        skipped++
        continue
      }

      // Najít odpovídající sazbu
      const rate = rates.find(r => sortOrder >= r.gradeFrom && sortOrder <= r.gradeTo)
      if (!rate) {
        skipped++
        continue
      }

      await prisma.tuitionCharge.create({
        data: {
          studentId: student.id,
          period: period.trim(),
          amount: rate.annualFee,
          currency: rate.currency,
          status: 'UNPAID',
        },
      })
      created++
    }

    return NextResponse.json({ created, skipped, total: students.length }, { status: 201 })
  } catch (error) {
    console.error('Error generating tuition charges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT — aktualizace předpisu (poznámky, status, částka)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = checkRateLimit(`tuition-charges:${user.id}`, 20, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const data: Record<string, any> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.amount !== undefined && body.amount > 0) data.amount = body.amount

    if (Object.keys(data).length > 0) {
      await prisma.tuitionCharge.update({ where: { id: body.id }, data })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Tuition charge not found' }, { status: 404 })
    console.error('Error updating tuition charge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — smazání předpisu
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = checkRateLimit(`tuition-charges:${user.id}`, 20, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.tuitionCharge.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Tuition charge not found' }, { status: 404 })
    console.error('Error deleting tuition charge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
