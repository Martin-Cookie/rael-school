import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isManager } from '@/lib/auth'
import { parseCSV } from '@/lib/csvParser'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// GET /api/payment-imports — list all imports
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const imports = await prisma.paymentImport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        importedBy: { select: { firstName: true, lastName: true } },
        _count: { select: { rows: true } },
      },
    })

    return NextResponse.json({ imports })
  } catch (error) {
    console.error('GET /api/payment-imports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/payment-imports — upload CSV file, parse, save rows
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isManager(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()

    // Parse CSV
    const { rows, errors } = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({
        error: 'No valid rows found',
        parseErrors: errors,
      }, { status: 400 })
    }

    // Create import + rows in a transaction
    const paymentImport = await prisma.$transaction(async (tx) => {
      const imp = await tx.paymentImport.create({
        data: {
          fileName: file.name,
          fileType: 'csv',
          importedById: user.id,
          totalRows: rows.length,
          matchedRows: 0,
          status: 'READY', // CSV is parsed synchronously, so immediately READY
        },
      })

      // Create all rows
      await tx.paymentImportRow.createMany({
        data: rows.map((row) => ({
          importId: imp.id,
          transactionDate: row.transactionDate,
          amount: row.amount,
          currency: row.currency,
          variableSymbol: row.variableSymbol,
          senderName: row.senderName,
          senderAccount: row.senderAccount,
          message: row.message,
          rawData: row.rawData,
          status: 'NEW',
          matchConfidence: 'NONE',
        })),
      })

      return imp
    })

    return NextResponse.json({
      import: paymentImport,
      totalRows: rows.length,
      parseErrors: errors.length > 0 ? errors : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/payment-imports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
