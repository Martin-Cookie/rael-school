import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tuitionRates = await prisma.tuitionRate.findMany({
      where: { isActive: true },
      orderBy: { gradeFrom: 'asc' },
    })
    return NextResponse.json({ tuitionRates })
  } catch (error) {
    console.error('Error fetching tuition rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, nameEn, nameSw, gradeFrom, gradeTo, annualFee, currency } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (gradeFrom === undefined || gradeTo === undefined) return NextResponse.json({ error: 'Grade range is required' }, { status: 400 })
    if (!annualFee || annualFee <= 0) return NextResponse.json({ error: 'Annual fee must be positive' }, { status: 400 })
    const tuitionRate = await prisma.tuitionRate.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        nameSw: nameSw?.trim() || null,
        gradeFrom,
        gradeTo,
        annualFee,
        currency: currency || 'CZK',
      },
    })
    return NextResponse.json({ tuitionRate }, { status: 201 })
  } catch (error) {
    console.error('Error creating tuition rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const data: Record<string, any> = {}
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.nameEn !== undefined) data.nameEn = body.nameEn?.trim() || null
    if (body.nameSw !== undefined) data.nameSw = body.nameSw?.trim() || null
    if (body.gradeFrom !== undefined) data.gradeFrom = body.gradeFrom
    if (body.gradeTo !== undefined) data.gradeTo = body.gradeTo
    if (body.annualFee !== undefined && body.annualFee > 0) data.annualFee = body.annualFee
    if (body.currency !== undefined) data.currency = body.currency
    if (Object.keys(data).length > 0) {
      await prisma.tuitionRate.update({ where: { id: body.id }, data })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating tuition rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.tuitionRate.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tuition rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
