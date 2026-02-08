import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
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
