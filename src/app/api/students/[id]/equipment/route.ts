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
    const { type, condition, acquiredAt, notes } = await request.json()
    if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    await prisma.equipment.create({
      data: { studentId, type, condition: condition || 'new', acquiredAt: acquiredAt ? new Date(acquiredAt) : null, notes: notes || null },
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error adding equipment:', error)
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
    const { equipmentId } = await request.json()
    if (!equipmentId) return NextResponse.json({ error: 'Equipment ID required' }, { status: 400 })
    await prisma.equipment.delete({ where: { id: equipmentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment:', error)
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

    const { id: studentId } = params
    const { equipment } = await request.json()

    // Delete existing and recreate
    await prisma.equipment.deleteMany({ where: { studentId } })

    if (equipment && equipment.length > 0) {
      await prisma.equipment.createMany({
        data: equipment.map((eq: any) => ({
          studentId,
          type: eq.type,
          condition: eq.condition,
          acquiredAt: eq.acquiredAt ? new Date(eq.acquiredAt) : null,
          notes: eq.notes || null,
        })),
      })
    }

    const updated = await prisma.equipment.findMany({
      where: { studentId },
      orderBy: { type: 'asc' },
    })

    return NextResponse.json({ equipment: updated })
  } catch (error) {
    console.error('Error updating equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
