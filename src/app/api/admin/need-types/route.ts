import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const needTypes = await prisma.needType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ needTypes })
  } catch (error) {
    console.error('Error fetching need types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, sortOrder } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const existing = await prisma.needType.findUnique({ where: { name: name.trim() } })
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.needType.update({
          where: { id: existing.id }, data: { isActive: true, sortOrder: sortOrder ?? 0 },
        })
        return NextResponse.json({ needType: reactivated }, { status: 201 })
      }
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    const needType = await prisma.needType.create({ data: { name: name.trim(), sortOrder: sortOrder ?? 0 } })
    return NextResponse.json({ needType }, { status: 201 })
  } catch (error) {
    console.error('Error creating need type:', error)
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
      await prisma.needType.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating need types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.needType.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting need type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
