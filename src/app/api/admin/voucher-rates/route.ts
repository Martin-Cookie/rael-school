import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const voucherRates = await prisma.voucherRate.findMany({
      where: { isActive: true },
      orderBy: { currency: 'asc' },
    })
    return NextResponse.json({ voucherRates })
  } catch (error) {
    console.error('Error fetching voucher rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { currency, rate } = await request.json()
    if (!currency?.trim()) return NextResponse.json({ error: 'Currency is required' }, { status: 400 })
    if (!rate || rate <= 0) return NextResponse.json({ error: 'Rate must be positive' }, { status: 400 })
    const existing = await prisma.voucherRate.findUnique({ where: { currency: currency.trim().toUpperCase() } })
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.voucherRate.update({
          where: { id: existing.id }, data: { isActive: true, rate },
        })
        return NextResponse.json({ voucherRate: reactivated }, { status: 201 })
      }
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    const voucherRate = await prisma.voucherRate.create({
      data: { currency: currency.trim().toUpperCase(), rate },
    })
    return NextResponse.json({ voucherRate }, { status: 201 })
  } catch (error) {
    console.error('Error creating voucher rate:', error)
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
    if (body.currency !== undefined && body.currency.trim()) data.currency = body.currency.trim().toUpperCase()
    if (body.rate !== undefined && body.rate > 0) data.rate = body.rate
    if (Object.keys(data).length > 0) {
      await prisma.voucherRate.update({ where: { id: body.id }, data })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating voucher rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.voucherRate.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voucher rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
