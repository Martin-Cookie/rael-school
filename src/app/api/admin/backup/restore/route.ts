import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { writeFile, copyFile } from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { checkRateLimit } from '@/lib/rateLimit'

// Validate that the uploaded file is a valid SQLite database with expected tables
function validateSqliteFile(buffer: Buffer): { valid: boolean; error?: string } {
  // Check SQLite magic header: first 16 bytes start with "SQLite format 3\000"
  const header = buffer.slice(0, 16).toString('ascii')
  if (!header.startsWith('SQLite format 3')) {
    return { valid: false, error: 'File is not a valid SQLite database' }
  }

  if (buffer.length < 1024) {
    return { valid: false, error: 'File is too small to be a valid database' }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 3 restores per hour per user
    const rl = checkRateLimit(`restore:${user.id}`, 3, 60 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json({ error: `Too many restore attempts. Retry after ${rl.retryAfter}s.` }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File is too large (max 50 MB)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate SQLite file
    const validation = validateSqliteFile(buffer)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const backupPath = path.join(process.cwd(), 'prisma', 'dev.db.before-restore')
    const tempPath = path.join(process.cwd(), 'prisma', 'dev.db.temp-restore')

    // Write uploaded file to temp location first
    await writeFile(tempPath, buffer)

    // Validate that the uploaded DB has the expected tables using sqlite3
    try {
      const tables = execSync(`sqlite3 "${tempPath}" ".tables"`, { encoding: 'utf-8' })
      const requiredTables = ['Student', 'User', 'Equipment', 'Need']
      const missingTables = requiredTables.filter(t => !tables.includes(t))

      if (missingTables.length > 0) {
        // Clean up temp file
        const { unlink } = await import('fs/promises')
        await unlink(tempPath).catch(() => {})
        return NextResponse.json({
          error: `Database is missing required tables: ${missingTables.join(', ')}`,
        }, { status: 400 })
      }
    } catch {
      // If sqlite3 is not available, skip deep validation (header check already passed)
    }

    // Create safety backup of current database
    try {
      await copyFile(dbPath, backupPath)
    } catch {
      // If current DB doesn't exist, that's fine
    }

    // Replace database with uploaded file
    await copyFile(tempPath, dbPath)

    // Clean up temp file
    const { unlink } = await import('fs/promises')
    await unlink(tempPath).catch(() => {})

    // Post-restore integrity check
    try {
      const { execFileSync } = await import('child_process')
      const integrity = execFileSync('sqlite3', [dbPath, 'PRAGMA integrity_check'], { encoding: 'utf-8' }).trim()
      if (integrity !== 'ok') {
        // Restore previous database from backup
        await copyFile(backupPath, dbPath)
        return NextResponse.json({
          error: `Database integrity check failed: ${integrity}. Previous database has been restored.`,
        }, { status: 400 })
      }
    } catch {
      // If sqlite3 is not available, skip integrity check
    }

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully. Previous database saved as dev.db.before-restore.',
    })
  } catch (error) {
    console.error('Error restoring database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
