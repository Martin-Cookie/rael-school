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
    const category = formData.get('category') as string || 'visit'
    const description = formData.get('description') as string || ''
    const takenAt = formData.get('takenAt') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', studentId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    const filePath = path.join(uploadDir, fileName)
    const publicPath = `/uploads/${studentId}/${fileName}`

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Save to database with custom date
    const photo = await prisma.photo.create({
      data: {
        studentId,
        category,
        fileName,
        filePath: publicPath,
        description,
        takenAt: takenAt ? new Date(takenAt) : new Date(),
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
