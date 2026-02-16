import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const healthTypes = await prisma.healthCheckType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ healthTypes })
  } catch (error) {
    console.error('Error fetching health types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, nameEn, nameSw, sortOrder } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const existing = await prisma.healthCheckType.findUnique({ where: { name: name.trim() } })
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.healthCheckType.update({
          where: { id: existing.id }, data: { isActive: true, sortOrder: sortOrder ?? 0, nameEn: nameEn || null, nameSw: nameSw || null },
        })
        return NextResponse.json({ healthType: reactivated }, { status: 201 })
      }
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    const healthType = await prisma.healthCheckType.create({ data: { name: name.trim(), nameEn: nameEn || null, nameSw: nameSw || null, sortOrder: sortOrder ?? 0 } })
    return NextResponse.json({ healthType }, { status: 201 })
  } catch (error) {
    console.error('Error creating health type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { orders } = await request.json()
    if (!orders || !Array.isArray(orders)) return NextResponse.json({ error: 'Orders array required' }, { status: 400 })
    for (const item of orders) {
      await prisma.healthCheckType.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating health types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.healthCheckType.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting health type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
