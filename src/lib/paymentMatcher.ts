import { PrismaClient } from '@prisma/client'

// Types for matching results
interface MatchResult {
  status: 'NEW' | 'MATCHED' | 'PARTIAL' | 'DUPLICATE'
  sponsorId: string | null
  studentId: string | null
  paymentTypeId: string | null
  matchConfidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  matchNotes: string
  duplicateOfId: string | null
}

interface RowData {
  id: string
  transactionDate: Date
  amount: number
  currency: string
  variableSymbol: string | null
  senderName: string | null
  senderAccount: string | null
  message: string | null
}

// Keyword → PaymentType name mapping
const PAYMENT_TYPE_KEYWORDS: { keywords: string[]; typeName: string }[] = [
  { keywords: ['školné', 'tuition', 'school fee', 'skolne', 'skolné'], typeName: 'Školné' },
  { keywords: ['stravenk', 'voucher', 'jídlo', 'food', 'meal'], typeName: 'Stravenky' },
  { keywords: ['ordinace', 'klinik', 'clinic', 'lékař', 'doctor', 'health'], typeName: 'Ordinace - měsíční příspěvek' },
  { keywords: ['káva', 'coffee', 'café', 'kafe', 'kávu'], typeName: 'Platba za kávu' },
  { keywords: ['tane', 'dance', 'crew'], typeName: 'Taneční klub - měsíční příspěvek' },
  { keywords: ['seminář', 'seminar', 'teen', 'náctilet'], typeName: 'Semináře pro náctileté - měsíční příspěvek' },
]

/**
 * Run automatic matching on all rows of an import.
 * Updates rows in-place in the database and returns match count.
 */
export async function runMatching(prisma: PrismaClient, importId: string): Promise<number> {
  // Load all rows for this import
  const rows = await prisma.paymentImportRow.findMany({
    where: { importId, status: 'NEW' },
  })

  if (rows.length === 0) return 0

  // Preload reference data
  const sponsors = await prisma.user.findMany({
    where: { role: 'SPONSOR', isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      variableSymbol: true,
      bankAccount: true,
      sponsorships: {
        where: { isActive: true },
        select: { studentId: true },
      },
    },
  })

  const students = await prisma.student.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
  })

  const paymentTypes = await prisma.paymentType.findMany({
    where: { isActive: true },
  })

  // Build lookup maps
  const vsByUser = new Map<string, typeof sponsors[0]>()
  const accountByUser = new Map<string, typeof sponsors[0]>()
  for (const s of sponsors) {
    if (s.variableSymbol) vsByUser.set(s.variableSymbol, s)
    if (s.bankAccount) accountByUser.set(s.bankAccount, s)
  }

  const paymentTypeByName = new Map<string, string>()
  for (const pt of paymentTypes) {
    paymentTypeByName.set(pt.name, pt.id)
  }

  let matchedCount = 0

  for (const row of rows) {
    const result = await matchRow(
      prisma, row, sponsors, students,
      vsByUser, accountByUser, paymentTypeByName,
    )

    await prisma.paymentImportRow.update({
      where: { id: row.id },
      data: {
        status: result.status,
        sponsorId: result.sponsorId,
        studentId: result.studentId,
        paymentTypeId: result.paymentTypeId,
        matchConfidence: result.matchConfidence,
        matchNotes: result.matchNotes,
        duplicateOfId: result.duplicateOfId,
      },
    })

    if (result.status === 'MATCHED') matchedCount++
  }

  // Update import stats
  await prisma.paymentImport.update({
    where: { id: importId },
    data: { matchedRows: matchedCount },
  })

  return matchedCount
}

async function matchRow(
  prisma: PrismaClient,
  row: RowData,
  sponsors: { id: string; firstName: string; lastName: string; variableSymbol: string | null; bankAccount: string | null; sponsorships: { studentId: string }[] }[],
  students: { id: string; firstName: string; lastName: string }[],
  vsByUser: Map<string, typeof sponsors[0]>,
  accountByUser: Map<string, typeof sponsors[0]>,
  paymentTypeByName: Map<string, string>,
): Promise<MatchResult> {
  const notes: string[] = []
  let sponsorId: string | null = null
  let studentId: string | null = null
  let paymentTypeId: string | null = null
  let confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE'
  let duplicateOfId: string | null = null

  // === KROK 1: Detekce duplikátů ===
  const dayMs = 24 * 60 * 60 * 1000
  const dateFrom = new Date(row.transactionDate.getTime() - dayMs)
  const dateTo = new Date(row.transactionDate.getTime() + dayMs)

  const existingPayment = await prisma.sponsorPayment.findFirst({
    where: {
      paymentDate: { gte: dateFrom, lte: dateTo },
      amount: row.amount,
      currency: row.currency,
    },
    select: { id: true },
  })

  if (existingPayment) {
    // Also check voucher purchases
    notes.push(`Možný duplikát: SponsorPayment ${existingPayment.id}`)
    return {
      status: 'DUPLICATE',
      sponsorId: null,
      studentId: null,
      paymentTypeId: null,
      matchConfidence: 'HIGH',
      matchNotes: notes.join('; '),
      duplicateOfId: existingPayment.id,
    }
  }

  const existingVoucher = await prisma.voucherPurchase.findFirst({
    where: {
      purchaseDate: { gte: dateFrom, lte: dateTo },
      amount: row.amount,
    },
    select: { id: true },
  })

  if (existingVoucher) {
    notes.push(`Možný duplikát: VoucherPurchase ${existingVoucher.id}`)
    return {
      status: 'DUPLICATE',
      sponsorId: null,
      studentId: null,
      paymentTypeId: null,
      matchConfidence: 'HIGH',
      matchNotes: notes.join('; '),
      duplicateOfId: existingVoucher.id,
    }
  }

  // === KROK 2: Identifikace sponzora ===

  // 2a: Match by VS
  if (row.variableSymbol) {
    const sponsor = vsByUser.get(row.variableSymbol)
    if (sponsor) {
      sponsorId = sponsor.id
      confidence = 'HIGH'
      notes.push(`VS shoda: ${row.variableSymbol} → ${sponsor.firstName} ${sponsor.lastName}`)
    }
  }

  // 2b: Match by bank account
  if (!sponsorId && row.senderAccount) {
    const sponsor = accountByUser.get(row.senderAccount)
    if (sponsor) {
      sponsorId = sponsor.id
      confidence = 'HIGH'
      notes.push(`Účet shoda: ${row.senderAccount} → ${sponsor.firstName} ${sponsor.lastName}`)
    }
  }

  // 2c: Match by sender name (fuzzy)
  if (!sponsorId && row.senderName) {
    const normalizedSender = normalizeName(row.senderName)
    const senderParts = normalizedSender.split(/\s+/).filter(Boolean)

    // Try full name match first
    let bestMatch: typeof sponsors[0] | null = null
    let matchType: 'full' | 'lastName' | null = null

    for (const s of sponsors) {
      const normalizedFull = normalizeName(`${s.firstName} ${s.lastName}`)
      const sponsorParts = normalizedFull.split(/\s+/).filter(Boolean)

      // Full name match: all parts of sponsor name found in sender name
      if (sponsorParts.length >= 2 && senderParts.length >= 2) {
        const allFound = sponsorParts.every(p => senderParts.some(sp => sp === p))
        if (allFound) {
          bestMatch = s
          matchType = 'full'
          break
        }
      }
    }

    // Try last name only if no full match
    if (!bestMatch) {
      const lastNameMatches = sponsors.filter(s => {
        const normalizedLast = normalizeName(s.lastName)
        return senderParts.includes(normalizedLast)
      })
      // Only use last name match if unique
      if (lastNameMatches.length === 1) {
        bestMatch = lastNameMatches[0]
        matchType = 'lastName'
      }
    }

    if (bestMatch && matchType) {
      sponsorId = bestMatch.id
      if (matchType === 'full') {
        confidence = 'MEDIUM'
        notes.push(`Jméno shoda: "${row.senderName}" → ${bestMatch.firstName} ${bestMatch.lastName}`)
      } else {
        confidence = 'LOW'
        notes.push(`Příjmení shoda: "${row.senderName}" → ${bestMatch.firstName} ${bestMatch.lastName}`)
      }
    }
  }

  // === KROK 3: Identifikace studenta ===

  if (sponsorId) {
    const sponsor = sponsors.find(s => s.id === sponsorId)
    if (sponsor) {
      const activeStudentIds = sponsor.sponsorships.map(sp => sp.studentId)
      if (activeStudentIds.length === 1) {
        studentId = activeStudentIds[0]
        notes.push(`Sponzor má 1 studenta → přiřazeno`)
      } else if (activeStudentIds.length > 1) {
        notes.push(`Sponzor má ${activeStudentIds.length} studentů → nutný ruční výběr`)
      }
    }
  }

  // Try finding student name in message (if no student yet)
  if (!studentId && row.message) {
    const foundStudent = findStudentInMessage(row.message, students)
    if (foundStudent) {
      studentId = foundStudent.id
      if (confidence === 'NONE') confidence = 'LOW'
      notes.push(`Student z zprávy: "${row.message}" → ${foundStudent.firstName} ${foundStudent.lastName}`)
    }
  }

  // === KROK 4: Identifikace typu platby ===

  if (row.message) {
    const msgLower = row.message.toLowerCase()
    for (const { keywords, typeName } of PAYMENT_TYPE_KEYWORDS) {
      if (keywords.some(kw => msgLower.includes(kw))) {
        const typeId = paymentTypeByName.get(typeName)
        if (typeId) {
          paymentTypeId = typeId
          notes.push(`Typ platby: "${typeName}"`)
          break
        }
      }
    }
  }

  // === KROK 5: Výsledný status ===

  let status: 'NEW' | 'MATCHED' | 'PARTIAL' = 'NEW'
  if (sponsorId && studentId && paymentTypeId) {
    status = 'MATCHED'
  } else if (sponsorId || studentId || paymentTypeId) {
    status = 'PARTIAL'
  }

  return {
    status,
    sponsorId,
    studentId,
    paymentTypeId,
    matchConfidence: confidence,
    matchNotes: notes.join('; '),
    duplicateOfId,
  }
}

/**
 * Normalize name: remove diacritics, lowercase, remove titles
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/\b(pan|pani|ing|mgr|mudr|mvdr|mddr|phdr|rndr|judr|bc|doc|prof|ph\.d|csc)\b\.?/g, '') // remove titles
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Try to find a student name in the message text.
 * Matches firstName + lastName of any student.
 */
function findStudentInMessage(
  message: string,
  students: { id: string; firstName: string; lastName: string }[],
): { id: string; firstName: string; lastName: string } | null {
  const msgNorm = normalizeName(message)

  for (const s of students) {
    const firstNorm = normalizeName(s.firstName)
    const lastNorm = normalizeName(s.lastName)

    // Match both first + last name (in any order)
    if (firstNorm.length >= 3 && lastNorm.length >= 3) {
      if (msgNorm.includes(firstNorm) && msgNorm.includes(lastNorm)) {
        return s
      }
    }

    // Match "firstName lastName" as a phrase
    const fullNorm = `${firstNorm} ${lastNorm}`
    if (fullNorm.length >= 5 && msgNorm.includes(fullNorm)) {
      return s
    }
  }

  return null
}
