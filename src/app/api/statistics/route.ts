import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type MonthData = {
  sponsorPaymentsAmount: Record<string, number>
  sponsorPaymentsCount: number
  voucherPurchasesAmount: number
  voucherPurchasesCount: number
  voucherUsagesCount: number
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Všechny agregace běží na DB úrovni (groupBy + aggregate + raw strftime),
    // místo dřívějšího načítání celých tabulek do JS. Pro škálovatelnost nad ~10k plateb.
    const [
      students,
      sponsors,
      paymentTypes,
      totalStudents,
      totalSponsors,
      spCount,
      spByCurrencyAgg,
      vpTotal,
      vuTotal,
      vpByStudent,
      vuByStudent,
      spByStudent,
      spBySponsorByCurrency,
      spBySponsorByType,
      spMonthly,
      vpMonthly,
      vuMonthly,
    ] = await Promise.all([
      prisma.student.findMany({
        where: { isActive: true },
        select: { id: true, studentNo: true, firstName: true, lastName: true, className: true },
        orderBy: { lastName: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'SPONSOR', isActive: true },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          sponsorships: { where: { isActive: true }, select: { studentId: true } },
        },
      }),
      prisma.paymentType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'SPONSOR', isActive: true } }),
      prisma.sponsorPayment.count(),
      prisma.sponsorPayment.groupBy({
        by: ['currency'],
        _sum: { amount: true },
      }),
      prisma.voucherPurchase.aggregate({
        _sum: { count: true, amount: true },
      }),
      prisma.voucherUsage.aggregate({
        _sum: { count: true },
      }),
      prisma.voucherPurchase.groupBy({
        by: ['studentId'],
        _sum: { count: true },
      }),
      prisma.voucherUsage.groupBy({
        by: ['studentId'],
        _sum: { count: true },
      }),
      prisma.sponsorPayment.groupBy({
        by: ['studentId', 'paymentType', 'currency'],
        _sum: { amount: true },
      }),
      prisma.sponsorPayment.groupBy({
        by: ['sponsorId', 'currency'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sponsorPayment.groupBy({
        by: ['sponsorId', 'paymentType', 'currency'],
        _sum: { amount: true },
      }),
      // SQLite ukládá Prisma DateTime jako unix-ms integer, proto dělíme 1000 a
      // používáme 'unixepoch' modifikátor, aby strftime správně bucketoval měsíce.
      prisma.$queryRaw<Array<{ ym: string; currency: string; total: number; cnt: number }>>`
        SELECT strftime('%Y-%m', paymentDate / 1000, 'unixepoch') as ym, currency, CAST(SUM(amount) AS REAL) as total, CAST(COUNT(*) AS REAL) as cnt
        FROM SponsorPayment
        GROUP BY ym, currency
      `,
      prisma.$queryRaw<Array<{ ym: string; total: number; totalCount: number }>>`
        SELECT strftime('%Y-%m', purchaseDate / 1000, 'unixepoch') as ym, CAST(SUM(amount) AS REAL) as total, CAST(SUM(count) AS REAL) as totalCount
        FROM VoucherPurchase
        GROUP BY ym
      `,
      prisma.$queryRaw<Array<{ ym: string; totalCount: number }>>`
        SELECT strftime('%Y-%m', usageDate / 1000, 'unixepoch') as ym, CAST(SUM(count) AS REAL) as totalCount
        FROM VoucherUsage
        GROUP BY ym
      `,
    ])

    // === voucherStats (per student) ===
    const vpMap = new Map(vpByStudent.map(g => [g.studentId, g._sum.count || 0]))
    const vuMap = new Map(vuByStudent.map(g => [g.studentId, g._sum.count || 0]))

    const voucherStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      purchased: vpMap.get(s.id) || 0,
      used: vuMap.get(s.id) || 0,
    }))

    // === sponsorPaymentStats (per student) ===
    // Shape: { [studentId]: { [paymentType]: { total, currency } } }
    // Zachovává původní chování: pokud má student stejný paymentType ve více měnách,
    // total se sečte napříč měnami a currency zůstane první zaznamenaná.
    const spStudentMap: Record<string, Record<string, { total: number; currency: string }>> = {}
    for (const g of spByStudent) {
      if (!spStudentMap[g.studentId]) spStudentMap[g.studentId] = {}
      const entry = spStudentMap[g.studentId][g.paymentType]
      const amount = g._sum.amount || 0
      if (!entry) {
        spStudentMap[g.studentId][g.paymentType] = { total: amount, currency: g.currency }
      } else {
        entry.total += amount
      }
    }

    const sponsorPaymentStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      payments: spStudentMap[s.id] || {},
    }))

    // === summary ===
    const spByCurrency: Record<string, number> = {}
    for (const g of spByCurrencyAgg) {
      spByCurrency[g.currency] = g._sum.amount || 0
    }

    const summary = {
      totalStudents,
      totalSponsors,
      sponsorPaymentCount: spCount,
      sponsorPaymentsByCurrency: spByCurrency,
      vouchersPurchased: vpTotal._sum.count || 0,
      vouchersUsed: vuTotal._sum.count || 0,
      vouchersAmount: vpTotal._sum.amount || 0,
    }

    // === monthlyStats ===
    const monthlyMap = new Map<string, MonthData>()
    function ensureMonth(key: string): MonthData {
      let d = monthlyMap.get(key)
      if (!d) {
        d = {
          sponsorPaymentsAmount: {},
          sponsorPaymentsCount: 0,
          voucherPurchasesAmount: 0,
          voucherPurchasesCount: 0,
          voucherUsagesCount: 0,
        }
        monthlyMap.set(key, d)
      }
      return d
    }

    for (const r of spMonthly) {
      if (!r.ym) continue
      const d = ensureMonth(r.ym)
      d.sponsorPaymentsAmount[r.currency] = (d.sponsorPaymentsAmount[r.currency] || 0) + Number(r.total)
      d.sponsorPaymentsCount += Number(r.cnt)
    }
    for (const r of vpMonthly) {
      if (!r.ym) continue
      const d = ensureMonth(r.ym)
      d.voucherPurchasesAmount += Number(r.total)
      d.voucherPurchasesCount += Number(r.totalCount)
    }
    for (const r of vuMonthly) {
      if (!r.ym) continue
      const d = ensureMonth(r.ym)
      d.voucherUsagesCount += Number(r.totalCount)
    }

    const monthlyStats = Array.from(monthlyMap.entries())
      .map(([key, val]) => ({
        year: parseInt(key.split('-')[0]),
        month: parseInt(key.split('-')[1]),
        ...val,
      }))
      .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)

    const years = [...new Set(monthlyStats.map(m => m.year))].sort((a, b) => b - a)

    // === sponsorStats ===
    const sponsorPaymentMap: Record<string, {
      byCurrency: Record<string, number>
      byType: Record<string, Record<string, number>>
      count: number
    }> = {}

    for (const g of spBySponsorByCurrency) {
      if (!g.sponsorId) continue
      if (!sponsorPaymentMap[g.sponsorId]) {
        sponsorPaymentMap[g.sponsorId] = { byCurrency: {}, byType: {}, count: 0 }
      }
      sponsorPaymentMap[g.sponsorId].byCurrency[g.currency] = g._sum.amount || 0
      sponsorPaymentMap[g.sponsorId].count += g._count
    }

    for (const g of spBySponsorByType) {
      if (!g.sponsorId) continue
      if (!sponsorPaymentMap[g.sponsorId]) {
        sponsorPaymentMap[g.sponsorId] = { byCurrency: {}, byType: {}, count: 0 }
      }
      if (!sponsorPaymentMap[g.sponsorId].byType[g.paymentType]) {
        sponsorPaymentMap[g.sponsorId].byType[g.paymentType] = {}
      }
      sponsorPaymentMap[g.sponsorId].byType[g.paymentType][g.currency] = g._sum.amount || 0
    }

    const sponsorStats = sponsors.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      studentsCount: s.sponsorships.length,
      paymentCount: sponsorPaymentMap[s.id]?.count || 0,
      byCurrency: sponsorPaymentMap[s.id]?.byCurrency || {},
      byType: sponsorPaymentMap[s.id]?.byType || {},
    }))

    return NextResponse.json({
      voucherStats,
      sponsorPaymentStats,
      paymentTypes,
      summary,
      monthlyStats,
      years,
      sponsorStats,
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
