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

    const healthCheck = await prisma.healthCheck.create({
      data: {
        studentId,
        checkDate: new Date(data.checkDate),
        checkType: data.checkType,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ healthCheck }, { status: 201 })
  } catch (error) {
    console.error('Error creating health check:', error)
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

    const { checkId } = await request.json()

    if (!checkId) {
      return NextResponse.json({ error: 'Check ID required' }, { status: 400 })
    }

    await prisma.healthCheck.delete({ where: { id: checkId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting health check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
