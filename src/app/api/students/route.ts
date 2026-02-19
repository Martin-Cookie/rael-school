import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit, isSponsor } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const className = searchParams.get('class') || ''

    let where: any = { isActive: true }

    // Sponsors can only see their own students
    if (isSponsor(user.role)) {
      const sponsorships = await prisma.sponsorship.findMany({
        where: { userId: user.id, isActive: true },
        select: { studentId: true },
      })
      where.id = { in: sponsorships.map((s) => s.studentId) }
    }

    // Volunteers can only see assigned students
    if (user.role === 'VOLUNTEER') {
      const assignments = await prisma.volunteerAssignment.findMany({
        where: { userId: user.id },
        select: { studentId: true },
      })
      where.id = { in: assignments.map((a) => a.studentId) }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { studentNo: { contains: search } },
      ]
    }

    if (className) {
      where.className = className
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        sponsorships: {
          where: { isActive: true },
          include: { sponsor: { select: { firstName: true, lastName: true } } },
        },
        _count: {
          select: {
            needs: { where: { isFulfilled: false } },
            sponsorships: { where: { isActive: true } },
            photos: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Generate unique student number
    const lastStudent = await prisma.student.findFirst({
      orderBy: { studentNo: 'desc' },
    })
    const lastNum = lastStudent ? parseInt(lastStudent.studentNo.replace('RAEL-', '')) : 0
    const studentNo = `RAEL-${String(lastNum + 1).padStart(3, '0')}`

    const student = await prisma.student.create({
      data: {
        studentNo,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        className: data.className || null,
        healthStatus: data.healthStatus || null,
        motherName: data.motherName || null,
        motherAlive: data.motherAlive ?? null,
        fatherName: data.fatherName || null,
        fatherAlive: data.fatherAlive ?? null,
        siblings: data.siblings || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
