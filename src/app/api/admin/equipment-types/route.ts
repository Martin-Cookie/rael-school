import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const equipmentTypes = await prisma.equipmentType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ equipmentTypes })
  } catch (error) {
    console.error('Error fetching equipment types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, nameEn, nameSw, sortOrder, price } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const existing = await prisma.equipmentType.findUnique({ where: { name: name.trim() } })
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.equipmentType.update({
          where: { id: existing.id }, data: { isActive: true, sortOrder: sortOrder ?? 0, price: price ?? null, nameEn: nameEn || null, nameSw: nameSw || null },
        })
        return NextResponse.json({ equipmentType: reactivated }, { status: 201 })
      }
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    const equipmentType = await prisma.equipmentType.create({ data: { name: name.trim(), nameEn: nameEn || null, nameSw: nameSw || null, sortOrder: sortOrder ?? 0, price: price ?? null } })
    return NextResponse.json({ equipmentType }, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment type:', error)
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
        await prisma.equipmentType.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      }
    } else if (body.id) {
      await prisma.equipmentType.update({ where: { id: body.id }, data: { price: body.price ?? null } })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating equipment types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.equipmentType.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
