import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const wishTypes = await prisma.wishType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ wishTypes })
  } catch (error) {
    console.error('Error fetching wish types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, nameEn, nameSw, sortOrder, price } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const existing = await prisma.wishType.findUnique({ where: { name: name.trim() } })
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.wishType.update({
          where: { id: existing.id }, data: { isActive: true, sortOrder: sortOrder ?? 0, price: price ?? null, nameEn: nameEn || null, nameSw: nameSw || null },
        })
        return NextResponse.json({ wishType: reactivated }, { status: 201 })
      }
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    const wishType = await prisma.wishType.create({ data: { name: name.trim(), nameEn: nameEn || null, nameSw: nameSw || null, sortOrder: sortOrder ?? 0, price: price ?? null } })
    return NextResponse.json({ wishType }, { status: 201 })
  } catch (error) {
    console.error('Error creating wish type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (body.orders && Array.isArray(body.orders)) {
      for (const item of body.orders) {
        await prisma.wishType.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      }
    } else if (body.id) {
      const data: Record<string, any> = {}
      if (body.name !== undefined && body.name.trim()) data.name = body.name.trim()
      if (body.price !== undefined) data.price = body.price ?? null
      if (body.nameEn !== undefined) data.nameEn = body.nameEn || null
      if (body.nameSw !== undefined) data.nameSw = body.nameSw || null
      await prisma.wishType.update({ where: { id: body.id }, data })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating wish types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.wishType.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wish type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
