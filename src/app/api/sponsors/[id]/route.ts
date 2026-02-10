import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/sponsors/[id] — sponsor detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sponsor = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        sponsorships: {
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
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, studentNo: true }
            }
          },
          orderBy: { paymentDate: 'desc' },
        }
      },
    })

    if (!sponsor || sponsor.role !== 'SPONSOR') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { password, ...safe } = sponsor as any
    return NextResponse.json({ sponsor: safe })
  } catch (error) {
    console.error('GET /api/sponsors/[id] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT /api/sponsors/[id] — edit sponsor details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check email uniqueness (exclude current sponsor)
    const emailCheck = await prisma.user.findFirst({
      where: { email, id: { not: params.id } },
    })
    if (emailCheck) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { firstName, lastName, email, phone: phone || null },
    })

    const { password, ...safe } = updated as any
    return NextResponse.json({ sponsor: safe })
  } catch (error) {
    console.error('PUT /api/sponsors/[id] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/sponsors/[id] — toggle active/inactive
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Only ADMIN/MANAGER can deactivate' }, { status: 403 })
    }

    const sponsor = await prisma.user.findUnique({ where: { id: params.id } })
    if (!sponsor || sponsor.role !== 'SPONSOR') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: !sponsor.isActive },
    })

    // If deactivating, also deactivate all their sponsorships
    if (!updated.isActive) {
      await prisma.sponsorship.updateMany({
        where: { userId: params.id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      })
    }

    const { password, ...safe } = updated as any
    return NextResponse.json({ sponsor: safe })
  } catch (error) {
    console.error('PATCH /api/sponsors/[id] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
