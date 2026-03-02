import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 5 DB exports per hour per user
    const rl = checkRateLimit(`db-export:${user.id}`, 5, 60 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json({ error: `Too many export attempts. Retry after ${rl.retryAfter}s.` }, { status: 429 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const fileBuffer = await readFile(dbPath)

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const fileName = `rael-backup-${dateStr}.db`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error creating database backup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
