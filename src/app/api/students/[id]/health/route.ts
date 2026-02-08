import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
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
