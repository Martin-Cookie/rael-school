import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'

// GET /api/sponsors/names — lightweight list for dropdowns (id, name only)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sponsors = await prisma.user.findMany({
      where: { role: 'SPONSOR', isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('GET /api/sponsors/names error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
