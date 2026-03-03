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
 * Run automatic matching on all rows of a bank import.
 * Matches each row to a sponsor (by variable symbol / bank account / name),
 * a student (from message text or single sponsorship), and a payment type (by keywords).
 * Detects duplicates against existing payments. Updates rows in DB.
 * @param prisma - Prisma client instance
 * @param importId - ID of the PaymentImport to process
 * @returns Number of rows that were matched (status changed from NEW)
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

  // Pre-load existing payments/vouchers for duplicate detection (batch instead of N+1)
  const dates = rows.map(r => r.transactionDate.getTime())
  const dayMs = 24 * 60 * 60 * 1000
  const dateFrom = new Date(Math.min(...dates) - dayMs)
  const dateTo = new Date(Math.max(...dates) + dayMs)

  const existingPayments = await prisma.sponsorPayment.findMany({
    where: { paymentDate: { gte: dateFrom, lte: dateTo } },
    select: { id: true, paymentDate: true, amount: true, currency: true },
  })
  const existingVouchers = await prisma.voucherPurchase.findMany({
    where: { purchaseDate: { gte: dateFrom, lte: dateTo } },
    select: { id: true, purchaseDate: true, amount: true },
  })

  let matchedCount = 0

  for (const row of rows) {
    const result = matchRow(
      row, sponsors, students,
      vsByUser, accountByUser, paymentTypeByName,
      existingPayments, existingVouchers,
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

/**
 * Match a single import row to sponsor, student, and payment type.
 * Strategy: 1) variable symbol → sponsor, 2) bank account → sponsor,
 * 3) sender name → sponsor, 4) message keywords → payment type,
 * 5) message text → student name, 6) single sponsorship → student.
 */
function matchRow(
  row: RowData,
  sponsors: { id: string; firstName: string; lastName: string; variableSymbol: string | null; bankAccount: string | null; sponsorships: { studentId: string }[] }[],
  students: { id: string; firstName: string; lastName: string }[],
  vsByUser: Map<string, typeof sponsors[0]>,
  accountByUser: Map<string, typeof sponsors[0]>,
  paymentTypeByName: Map<string, string>,
  existingPayments: { id: string; paymentDate: Date; amount: number; currency: string }[],
  existingVouchers: { id: string; purchaseDate: Date; amount: number }[],
): MatchResult {
  const notes: string[] = []
  let sponsorId: string | null = null
  let studentId: string | null = null
  let paymentTypeId: string | null = null
  let confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE'
  let duplicateOfId: string | null = null

  // === KROK 1: Detekce duplikátů (in-memory z batch-loaded dat) ===
  const dayMs = 24 * 60 * 60 * 1000
  const dateFrom = row.transactionDate.getTime() - dayMs
  const dateTo = row.transactionDate.getTime() + dayMs

  const existingPayment = existingPayments.find(p =>
    p.paymentDate.getTime() >= dateFrom && p.paymentDate.getTime() <= dateTo &&
    p.amount === row.amount && p.currency === row.currency
  )

  if (existingPayment) {
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

  const existingVoucher = existingVouchers.find(v =>
    v.purchaseDate.getTime() >= dateFrom && v.purchaseDate.getTime() <= dateTo &&
    v.amount === row.amount
  )

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
 * Normalize a Czech name for fuzzy matching.
 * Removes diacritics, lowercases, strips academic titles (Ing., Mgr., etc.).
 * @param name - Raw name string (e.g. "Ing. Jan Novák")
 * @returns Normalized string (e.g. "jan novak")
 */
export function normalizeName(name: string): string {
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
 * Try to find a student name in the payment message text.
 * Matches both firstName + lastName (in any order) after normalizing.
 * @param message - Raw message from bank statement
 * @param students - Array of students to match against
 * @returns Matched student or null
 */
export function findStudentInMessage(
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
