import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

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

    const wish = await prisma.wish.create({
      data: {
        studentId,
        wishTypeId: data.wishTypeId || null,
        description: data.description,
        isFulfilled: data.isFulfilled || false,
        fulfilledAt: data.fulfilledAt ? new Date(data.fulfilledAt) : null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ wish }, { status: 201 })
  } catch (error) {
    console.error('Error creating wish:', error)
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

    const { wishId, ...data } = await request.json()

    const wish = await prisma.wish.update({
      where: { id: wishId },
      data: {
        description: data.description,
        isFulfilled: data.isFulfilled || false,
        fulfilledAt: data.isFulfilled ? new Date() : null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ wish })
  } catch (error) {
    console.error('Error updating wish:', error)
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

    const { wishId } = await request.json()

    await prisma.wish.delete({ where: { id: wishId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wish:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
