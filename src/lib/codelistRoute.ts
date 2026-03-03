import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

interface CodelistConfig {
  delegate: {
    findMany: (args: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  pluralKey: string    // e.g. 'needTypes'
  singularKey: string  // e.g. 'needType'
  hasPrice?: boolean
  label: string        // for error logs, e.g. 'need type'
}

export function createCodelistHandlers(config: CodelistConfig) {
  const { delegate, pluralKey, singularKey, hasPrice, label } = config

  async function GET() {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const items = await delegate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
      return NextResponse.json({ [pluralKey]: items })
    } catch (error) {
      console.error(`Error fetching ${label}:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function POST(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const rl = checkRateLimit(`codelist-write:${user.id}`, 30, 60_000)
      if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
      const { name, nameEn, nameSw, sortOrder, price } = await request.json()
      if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      const existing = await delegate.findUnique({ where: { name: name.trim() } })
      if (existing) {
        if (!existing.isActive) {
          const data: Record<string, any> = { isActive: true, sortOrder: sortOrder ?? 0, nameEn: nameEn || null, nameSw: nameSw || null }
          if (hasPrice) data.price = price ?? null
          const reactivated = await delegate.update({ where: { id: existing.id }, data })
          return NextResponse.json({ [singularKey]: reactivated }, { status: 201 })
        }
        return NextResponse.json({ error: 'Already exists' }, { status: 409 })
      }
      const data: Record<string, any> = { name: name.trim(), nameEn: nameEn || null, nameSw: nameSw || null, sortOrder: sortOrder ?? 0 }
      if (hasPrice) data.price = price ?? null
      const item = await delegate.create({ data })
      return NextResponse.json({ [singularKey]: item }, { status: 201 })
    } catch (error) {
      console.error(`Error creating ${label}:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function PUT(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const rl = checkRateLimit(`codelist-write:${user.id}`, 30, 60_000)
      if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
      const body = await request.json()
      if (body.orders && Array.isArray(body.orders)) {
        for (const item of body.orders) {
          await delegate.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
        }
      } else if (body.id) {
        const data: Record<string, any> = {}
        if (body.name !== undefined && body.name.trim()) data.name = body.name.trim()
        if (body.nameEn !== undefined) data.nameEn = body.nameEn || null
        if (body.nameSw !== undefined) data.nameSw = body.nameSw || null
        if (hasPrice && body.price !== undefined) data.price = body.price ?? null
        if (Object.keys(data).length > 0) {
          await delegate.update({ where: { id: body.id }, data })
        }
      } else {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      console.error(`Error updating ${label}:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function DELETE(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const rl = checkRateLimit(`codelist-write:${user.id}`, 30, 60_000)
      if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
      const { id } = await request.json()
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
      await delegate.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      console.error(`Error deleting ${label}:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return { GET, POST, PUT, DELETE }
}
