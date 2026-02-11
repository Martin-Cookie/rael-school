import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit, hashPassword } from '@/lib/auth'

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

    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json({ error: 'Jméno, příjmení a email jsou povinné / Name and email required' }, { status: 400 })
    }

    // Find or create sponsor user
    let sponsorUser = await prisma.user.findUnique({ where: { email: data.email } })

    if (!sponsorUser) {
      // Create new sponsor user with default password
      const defaultPassword = await hashPassword('sponsor123')
      sponsorUser = await prisma.user.create({
        data: {
          email: data.email,
          password: defaultPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          role: 'SPONSOR',
        },
      })
    }

    // Check if sponsorship already exists
    const existing = await prisma.sponsorship.findFirst({
      where: { studentId, userId: sponsorUser.id, isActive: true },
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Sponzorství již existuje / Sponsorship already exists' 
      }, { status: 400 })
    }

    const sponsorship = await prisma.sponsorship.create({
      data: {
        studentId,
        userId: sponsorUser.id,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ sponsorship }, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsorship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { sponsorshipId, notes, isActive } = data

    if (!sponsorshipId) {
      return NextResponse.json({ error: 'Sponsorship ID required' }, { status: 400 })
    }

    const sponsorship = await prisma.sponsorship.update({
      where: { id: sponsorshipId },
      data: {
        notes: notes ?? undefined,
        isActive: isActive ?? undefined,
      },
    })

    // Also update sponsor user info if provided
    if (data.sponsorUserId && (data.firstName || data.lastName || data.phone)) {
      await prisma.user.update({
        where: { id: data.sponsorUserId },
        data: {
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
        },
      })
    }

    return NextResponse.json({ sponsorship })
  } catch (error) {
    console.error('Error updating sponsorship:', error)
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

    const data = await request.json()
    const { sponsorshipId } = data

    if (!sponsorshipId) {
      return NextResponse.json({ error: 'Sponsorship ID required' }, { status: 400 })
    }

    // Hard delete sponsorship
    await prisma.sponsorship.delete({
      where: { id: sponsorshipId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing sponsorship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
