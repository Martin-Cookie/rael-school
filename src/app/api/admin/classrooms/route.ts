import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classrooms = await prisma.classRoom.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ classrooms })
  } catch (error) {
    console.error('Error fetching classrooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existing = await prisma.classRoom.findUnique({ where: { name: data.name.trim() } })
    if (existing && existing.isActive) {
      return NextResponse.json({ error: 'Třída s tímto názvem již existuje' }, { status: 400 })
    }

    if (existing && !existing.isActive) {
      const reactivated = await prisma.classRoom.update({
        where: { id: existing.id },
        data: { isActive: true, sortOrder: data.sortOrder || 0, nameEn: data.nameEn || null, nameSw: data.nameSw || null },
      })
      return NextResponse.json({ classroom: reactivated }, { status: 201 })
    }

    const classroom = await prisma.classRoom.create({
      data: {
        name: data.name.trim(),
        nameEn: data.nameEn || null,
        nameSw: data.nameSw || null,
        sortOrder: data.sortOrder || 0,
      },
    })

    return NextResponse.json({ classroom }, { status: 201 })
  } catch (error) {
    console.error('Error creating classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.orders) {
      for (const order of body.orders) {
        await prisma.classRoom.update({
          where: { id: order.id },
          data: { sortOrder: order.sortOrder },
        })
      }
    } else if (body.id) {
      const data: Record<string, any> = {}
      if (body.name !== undefined && body.name.trim()) data.name = body.name.trim()
      if (body.nameEn !== undefined) data.nameEn = body.nameEn || null
      if (body.nameSw !== undefined) data.nameSw = body.nameSw || null
      if (Object.keys(data).length > 0) {
        await prisma.classRoom.update({ where: { id: body.id }, data })
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating classrooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.classRoom.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
