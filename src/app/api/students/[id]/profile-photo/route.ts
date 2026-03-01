import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canEdit(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = params
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size: 10 MB' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name) || '.jpg'
    const fileName = `${studentId}${ext}`
    const filePath = path.join(uploadDir, fileName)
    const publicPath = `/uploads/profiles/${fileName}`

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    await prisma.student.update({
      where: { id: studentId },
      data: { profilePhoto: publicPath },
    })

    return NextResponse.json({ profilePhoto: publicPath }, { status: 200 })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
