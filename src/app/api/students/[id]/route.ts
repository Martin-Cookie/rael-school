import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        equipment: { orderBy: { type: 'asc' } },
        needs: { orderBy: { createdAt: 'desc' } },
        photos: { orderBy: { takenAt: 'desc' } },
        vouchers: { orderBy: { purchaseDate: 'desc' } },
        voucherUsages: { orderBy: { usageDate: 'desc' } },
        sponsorships: {
          include: { sponsor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
          orderBy: { startDate: 'desc' },
        },
        healthChecks: { orderBy: { checkDate: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        className: data.className || null,
        healthStatus: data.healthStatus || null,
        motherName: data.motherName || null,
        motherAlive: data.motherAlive ?? null,
        fatherName: data.fatherName || null,
        fatherAlive: data.fatherAlive ?? null,
        siblings: data.siblings || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error updating student:', error)
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

    const { id } = await params

    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
