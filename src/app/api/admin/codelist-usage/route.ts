import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

// GET /api/admin/codelist-usage?resource=paymentType&name=Školné
// Vrací { count: N, tables: [{ table, count }] } — kolik záznamů odkazuje
// na daný codelist item, aby admin viděl důsledky smazání.
//
// Poznámka: Většina codelist referencí je přes string (SponsorPayment.paymentType,
// Student.className, Equipment.type, HealthCheck.checkType), nikoli FK. Soft delete
// (isActive=false) proto existující záznamy neruší, ale uživatel se musí rozhodnout.

type Resource =
  | 'paymentType'
  | 'classRoom'
  | 'needType'
  | 'wishType'
  | 'equipmentType'
  | 'healthCheckType'

const VALID_RESOURCES = new Set<Resource>([
  'paymentType', 'classRoom', 'needType', 'wishType', 'equipmentType', 'healthCheckType',
])

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = checkRateLimit(`codelist-usage:${user.id}`, 60, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource') as Resource | null
    const name = searchParams.get('name')
    const id = searchParams.get('id')

    if (!resource || !VALID_RESOURCES.has(resource)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    if (!name && !id) {
      return NextResponse.json({ error: 'name or id required' }, { status: 400 })
    }

    const tables: { table: string; count: number }[] = []

    switch (resource) {
      case 'paymentType': {
        // SponsorPayment.paymentType je string (ne FK) — matchujeme podle jména
        if (name) {
          const count = await prisma.sponsorPayment.count({ where: { paymentType: name } })
          if (count > 0) tables.push({ table: 'SponsorPayment', count })
        }
        break
      }
      case 'classRoom': {
        // Student.className je string — matchujeme podle jména
        if (name) {
          const count = await prisma.student.count({ where: { className: name } })
          if (count > 0) tables.push({ table: 'Student', count })
        }
        break
      }
      case 'needType': {
        // Need.description — hrubá shoda podle jména (contains)
        if (name) {
          const count = await prisma.need.count({ where: { description: name } })
          if (count > 0) tables.push({ table: 'Need', count })
        }
        break
      }
      case 'wishType': {
        // Wish má FK wishTypeId — matchujeme podle id (primární) nebo podle description
        if (id) {
          const byFk = await prisma.wish.count({ where: { wishTypeId: id } })
          if (byFk > 0) tables.push({ table: 'Wish (FK)', count: byFk })
        }
        if (name) {
          const byName = await prisma.wish.count({ where: { description: name } })
          if (byName > 0) tables.push({ table: 'Wish (name)', count: byName })
        }
        break
      }
      case 'equipmentType': {
        // Equipment.type je string
        if (name) {
          const count = await prisma.equipment.count({ where: { type: name } })
          if (count > 0) tables.push({ table: 'Equipment', count })
        }
        break
      }
      case 'healthCheckType': {
        // HealthCheck.checkType je string
        if (name) {
          const count = await prisma.healthCheck.count({ where: { checkType: name } })
          if (count > 0) tables.push({ table: 'HealthCheck', count })
        }
        break
      }
    }

    const totalCount = tables.reduce((s, t) => s + t.count, 0)
    return NextResponse.json({ count: totalCount, tables })
  } catch (error) {
    console.error('GET /api/admin/codelist-usage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
