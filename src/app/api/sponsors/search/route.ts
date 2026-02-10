import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/sponsors/search?q=lastName — search sponsors by last name for autocomplete
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (q.length < 1) {
      return NextResponse.json({ sponsors: [] })
    }

    const sponsors = await prisma.user.findMany({
      where: {
        role: 'SPONSOR',
        isActive: true,
        OR: [
          { lastName: { contains: q } },
          { firstName: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: { lastName: 'asc' },
      take: 10,
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('GET /api/sponsors/search error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
