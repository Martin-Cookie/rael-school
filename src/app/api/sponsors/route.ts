import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// GET /api/sponsors — list all sponsors (Users with role SPONSOR)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {
      role: 'SPONSOR',
      ...(includeInactive ? {} : { isActive: true }),
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const sponsors = await prisma.user.findMany({
      where,
      include: {
        sponsorships: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentNo: true,
                className: true,
                isActive: true,
              }
            }
          }
        },
      },
      orderBy: { lastName: 'asc' },
    })

    // Aggregate payments per sponsor+currency using groupBy (DB-level, no N+1)
    const sponsorIds = sponsors.map(s => s.id)
    const paymentAggs = sponsorIds.length > 0
      ? await prisma.sponsorPayment.groupBy({
          by: ['sponsorId', 'currency'],
          _sum: { amount: true },
          where: { sponsorId: { in: sponsorIds } },
        })
      : []

    const paymentMap = new Map<string, Record<string, number>>()
    for (const agg of paymentAggs) {
      if (!agg.sponsorId) continue
      if (!paymentMap.has(agg.sponsorId)) paymentMap.set(agg.sponsorId, {})
      paymentMap.get(agg.sponsorId)![agg.currency] = agg._sum.amount || 0
    }

    const sponsorsWithTotals = sponsors.map(s => {
      const { password, ...rest } = s as any
      return { ...rest, paymentsByCurrency: paymentMap.get(s.id) || {} }
    })

    return NextResponse.json({ sponsors: sponsorsWithTotals })
  } catch (error) {
    console.error('GET /api/sponsors error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/sponsors — create new sponsor
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, notes } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate string lengths
    const MAX_NAME = 100
    const MAX_EMAIL = 200
    if (firstName.length > MAX_NAME || lastName.length > MAX_NAME) {
      return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 })
    }
    if (email.length > MAX_EMAIL) {
      return NextResponse.json({ error: 'Email too long (max 200 chars)' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // If exists and is inactive sponsor, reactivate
      if (existing.role === 'SPONSOR' && !existing.isActive) {
        const reactivated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            phone: phone || null,
            isActive: true,
          },
        })
        const { password, ...safe } = reactivated as any
        return NextResponse.json({ sponsor: safe, reactivated: true })
      }
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const randomPassword = crypto.randomBytes(16).toString('hex')
    const hashedPassword = await bcrypt.hash(randomPassword, 10)

    const sponsor = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'SPONSOR',
        isActive: true,
      },
    })

    const { password, ...safe } = sponsor as any
    return NextResponse.json({ sponsor: safe }, { status: 201 })
  } catch (error) {
    console.error('POST /api/sponsors error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
