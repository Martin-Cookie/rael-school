import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const students = await prisma.student.findMany({
      where: { isActive: true },
      orderBy: [{ className: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        studentNo: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        className: true,
        school: true,
        orphanStatus: true,
        healthStatus: true,
        motherName: true,
        motherAlive: true,
        fatherName: true,
        fatherAlive: true,
        siblings: true,
        notes: true,
        equipment: {
          select: { id: true, type: true, condition: true, acquiredAt: true, notes: true },
          orderBy: { type: 'asc' },
        },
        needs: {
          where: { isFulfilled: false },
          select: { id: true, description: true, notes: true },
          orderBy: { createdAt: 'desc' },
        },
        wishes: {
          where: { isFulfilled: false },
          select: { id: true, description: true, notes: true, wishType: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const needTypes = await prisma.needType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, price: true },
    })

    const wishTypes = await prisma.wishType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, price: true },
    })

    const equipmentTypes = await prisma.equipmentType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, price: true },
    })

    return NextResponse.json({ students, needTypes, wishTypes, equipmentTypes })
  } catch (error) {
    console.error('Visit cards API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
