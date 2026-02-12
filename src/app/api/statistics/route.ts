import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [students, paymentTypes, sponsorPayments, voucherPurchases, voucherUsages, sponsors] = await Promise.all([
      prisma.student.findMany({
        where: { isActive: true },
        select: {
          id: true,
          studentNo: true,
          firstName: true,
          lastName: true,
          className: true,
          vouchers: { select: { count: true } },
          voucherUsages: { select: { count: true } },
        },
        orderBy: { lastName: 'asc' },
      }),
      prisma.paymentType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.sponsorPayment.findMany({
        select: {
          studentId: true,
          sponsorId: true,
          paymentType: true,
          paymentDate: true,
          amount: true,
          currency: true,
        },
      }),
      prisma.voucherPurchase.findMany({
        select: {
          purchaseDate: true,
          amount: true,
          count: true,
        },
      }),
      prisma.voucherUsage.findMany({
        select: {
          usageDate: true,
          count: true,
        },
      }),
      prisma.user.findMany({
        where: { role: 'SPONSOR', isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          sponsorships: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      }),
    ])

    // === Existing: Voucher stats per student ===
    const voucherStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      purchased: s.vouchers.reduce((sum, v) => sum + v.count, 0),
      used: s.voucherUsages.reduce((sum, v) => sum + v.count, 0),
    }))

    // === Existing: Sponsor payments per student ===
    const paymentsByStudent: Record<string, Record<string, { total: number; currency: string }>> = {}
    sponsorPayments.forEach(p => {
      if (!paymentsByStudent[p.studentId]) paymentsByStudent[p.studentId] = {}
      if (!paymentsByStudent[p.studentId][p.paymentType]) {
        paymentsByStudent[p.studentId][p.paymentType] = { total: 0, currency: p.currency }
      }
      paymentsByStudent[p.studentId][p.paymentType].total += p.amount
    })

    const sponsorPaymentStats = students.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      payments: paymentsByStudent[s.id] || {},
    }))

    // === NEW: Summary ===
    const totalPurchasedVouchers = voucherPurchases.reduce((s, v) => s + v.count, 0)
    const totalUsedVouchers = voucherUsages.reduce((s, v) => s + v.count, 0)
    const totalVoucherAmount = voucherPurchases.reduce((s, v) => s + v.amount, 0)

    const spByCurrency: Record<string, number> = {}
    sponsorPayments.forEach(p => {
      spByCurrency[p.currency] = (spByCurrency[p.currency] || 0) + p.amount
    })

    const summary = {
      totalStudents: students.length,
      totalSponsors: sponsors.length,
      sponsorPaymentCount: sponsorPayments.length,
      sponsorPaymentsByCurrency: spByCurrency,
      vouchersPurchased: totalPurchasedVouchers,
      vouchersUsed: totalUsedVouchers,
      vouchersAmount: totalVoucherAmount,
    }

    // === NEW: Monthly stats ===
    const monthlyMap: Record<string, {
      sponsorPaymentsAmount: Record<string, number>
      sponsorPaymentsCount: number
      voucherPurchasesAmount: number
      voucherPurchasesCount: number
      voucherUsagesCount: number
    }> = {}

    function getMonthKey(date: Date): string {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    function ensureMonth(key: string) {
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          sponsorPaymentsAmount: {},
          sponsorPaymentsCount: 0,
          voucherPurchasesAmount: 0,
          voucherPurchasesCount: 0,
          voucherUsagesCount: 0,
        }
      }
    }

    sponsorPayments.forEach(p => {
      const key = getMonthKey(p.paymentDate)
      ensureMonth(key)
      monthlyMap[key].sponsorPaymentsAmount[p.currency] = (monthlyMap[key].sponsorPaymentsAmount[p.currency] || 0) + p.amount
      monthlyMap[key].sponsorPaymentsCount++
    })

    voucherPurchases.forEach(v => {
      const key = getMonthKey(v.purchaseDate)
      ensureMonth(key)
      monthlyMap[key].voucherPurchasesAmount += v.amount
      monthlyMap[key].voucherPurchasesCount += v.count
    })

    voucherUsages.forEach(v => {
      const key = getMonthKey(v.usageDate)
      ensureMonth(key)
      monthlyMap[key].voucherUsagesCount += v.count
    })

    const monthlyStats = Object.entries(monthlyMap)
      .map(([key, val]) => ({
        year: parseInt(key.split('-')[0]),
        month: parseInt(key.split('-')[1]),
        ...val,
      }))
      .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)

    // Collect available years
    const years = [...new Set(monthlyStats.map(m => m.year))].sort((a, b) => b - a)

    // === NEW: Sponsor stats ===
    const sponsorPaymentMap: Record<string, {
      byCurrency: Record<string, number>
      byType: Record<string, Record<string, number>>
      count: number
    }> = {}

    sponsorPayments.forEach(p => {
      if (!p.sponsorId) return
      if (!sponsorPaymentMap[p.sponsorId]) {
        sponsorPaymentMap[p.sponsorId] = { byCurrency: {}, byType: {}, count: 0 }
      }
      const sp = sponsorPaymentMap[p.sponsorId]
      sp.byCurrency[p.currency] = (sp.byCurrency[p.currency] || 0) + p.amount
      if (!sp.byType[p.paymentType]) sp.byType[p.paymentType] = {}
      sp.byType[p.paymentType][p.currency] = (sp.byType[p.paymentType][p.currency] || 0) + p.amount
      sp.count++
    })

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
