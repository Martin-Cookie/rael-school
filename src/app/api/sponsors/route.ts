import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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
        sponsorPayments: {
          select: {
            amount: true,
            currency: true,
          }
        }
      },
      orderBy: { lastName: 'asc' },
    })

    // Calculate total payments by currency for each sponsor
    const sponsorsWithTotals = sponsors.map(s => {
      const paymentsByCurrency: Record<string, number> = {}
      s.sponsorPayments.forEach(p => {
        paymentsByCurrency[p.currency] = (paymentsByCurrency[p.currency] || 0) + p.amount
      })
      const { sponsorPayments, password, ...rest } = s as any
      return { ...rest, paymentsByCurrency }
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

    const hashedPassword = await bcrypt.hash('sponsor123', 10)

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
