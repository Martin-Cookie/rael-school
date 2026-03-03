import { NextRequest, NextResponse } from 'next/server'
import { prisma, isNotFoundError } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = checkRateLimit(`student-detail-write:${user.id}`, 30, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { id: studentId } = params
    const data = await request.json()

    const need = await prisma.need.create({
      data: {
        studentId,
        description: data.description,
        isFulfilled: data.isFulfilled || false,
        fulfilledAt: data.fulfilledAt ? new Date(data.fulfilledAt) : null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ need }, { status: 201 })
  } catch (error) {
    console.error('Error creating need:', error)
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
    const rl = checkRateLimit(`student-detail-write:${user.id}`, 30, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { id: studentId } = params
    const { needId, ...data } = await request.json()

    const need = await prisma.need.update({
      where: { id: needId },
      data: {
        description: data.description,
        isFulfilled: data.isFulfilled || false,
        fulfilledAt: data.isFulfilled ? new Date() : null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ need })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Need not found' }, { status: 404 })
    console.error('Error updating need:', error)
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
    const rl = checkRateLimit(`student-detail-write:${user.id}`, 30, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { needId } = await request.json()

    await prisma.need.delete({ where: { id: needId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: 'Need not found' }, { status: 404 })
    console.error('Error deleting need:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
