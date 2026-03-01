import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
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
    const category = formData.get('category') as string || 'visit'
    const description = formData.get('description') as string || ''
    const takenAt = formData.get('takenAt') as string || ''

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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', studentId)
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name) || '.jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    const filePath = path.join(uploadDir, fileName)
    const publicPath = `/uploads/${studentId}/${fileName}`

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const photo = await prisma.photo.create({
      data: {
        studentId, category, fileName, filePath: publicPath, description,
        takenAt: takenAt ? new Date(takenAt) : new Date(),
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
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

    const { photoId } = await request.json()

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 })
    }

    // Get photo to delete file
    const photo = await prisma.photo.findUnique({ where: { id: photoId } })
    if (photo) {
      // Try to delete file from disk
      try {
        const filePath = path.join(process.cwd(), 'public', photo.filePath)
        await unlink(filePath)
      } catch {
        // File might not exist, that's ok
      }
      await prisma.photo.delete({ where: { id: photoId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
