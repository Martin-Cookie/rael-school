import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCsv).join(',')
  const dataLines = rows.map(row => row.map(escapeCsv).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !['students', 'sponsors', 'payments', 'codelists'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use: students, sponsors, payments, codelists' }, { status: 400 })
    }

    let csvContent: string = ''
    let fileName: string = ''
    const dateStr = new Date().toISOString().slice(0, 10)

    if (type === 'students') {
      const students = await prisma.student.findMany({
        include: {
          sponsorships: { where: { isActive: true }, include: { sponsor: { select: { firstName: true, lastName: true, email: true } } } },
          _count: { select: { equipment: true, needs: true, wishes: true, vouchers: true, sponsorPayments: true, healthChecks: true } },
        },
        orderBy: { lastName: 'asc' },
      })

      const headers = ['Číslo', 'Příjmení', 'Jméno', 'Datum narození', 'Pohlaví', 'Třída', 'Škola', 'Status sirotka', 'Zdravotní stav', 'Matka', 'Matka žije', 'Otec', 'Otec žije', 'Sourozenci', 'Sponzoři', 'Vybavení', 'Potřeby', 'Přání', 'Stravenky', 'Platby', 'Prohlídky', 'Poznámky']
      const rows = students.map(s => [
        s.studentNo,
        s.lastName,
        s.firstName,
        s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : '',
        s.gender || '',
        s.className || '',
        s.school || '',
        s.orphanStatus || '',
        s.healthStatus || '',
        s.motherName || '',
        s.motherAlive === null ? '' : s.motherAlive ? 'Ano' : 'Ne',
        s.fatherName || '',
        s.fatherAlive === null ? '' : s.fatherAlive ? 'Ano' : 'Ne',
        s.siblings || '',
        s.sponsorships.map(sp => `${sp.sponsor.lastName} ${sp.sponsor.firstName}`).join('; '),
        s._count.equipment,
        s._count.needs,
        s._count.wishes,
        s._count.vouchers,
        s._count.sponsorPayments,
        s._count.healthChecks,
        s.notes || '',
      ])

      csvContent = toCsv(headers, rows)
      fileName = `rael-students-${dateStr}.csv`

    } else if (type === 'sponsors') {
      const sponsors = await prisma.user.findMany({
        where: { role: 'SPONSOR' },
        include: {
          sponsorships: { where: { isActive: true }, include: { student: { select: { firstName: true, lastName: true, studentNo: true } } } },
          _count: { select: { sponsorPayments: true } },
        },
        orderBy: { lastName: 'asc' },
      })

      const headers = ['Příjmení', 'Jméno', 'Email', 'Telefon', 'VS', 'Bankovní účet', 'Aktivní', 'Studenti', 'Počet plateb']
      const rows = sponsors.map(sp => [
        sp.lastName,
        sp.firstName,
        sp.email,
        sp.phone || '',
        sp.variableSymbol || '',
        sp.bankAccount || '',
        sp.isActive ? 'Ano' : 'Ne',
        sp.sponsorships.map(s => `${s.student.lastName} ${s.student.firstName} (${s.student.studentNo})`).join('; '),
        sp._count.sponsorPayments,
      ])

      csvContent = toCsv(headers, rows)
      fileName = `rael-sponsors-${dateStr}.csv`

    } else if (type === 'payments') {
      const [sponsorPayments, voucherPurchases] = await Promise.all([
        prisma.sponsorPayment.findMany({
          include: {
            student: { select: { firstName: true, lastName: true, studentNo: true } },
            sponsor: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { paymentDate: 'desc' },
        }),
        prisma.voucherPurchase.findMany({
          include: {
            student: { select: { firstName: true, lastName: true, studentNo: true } },
            sponsor: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { purchaseDate: 'desc' },
        }),
      ])

      const headers = ['Typ', 'Datum', 'Částka', 'Měna', 'Student', 'Číslo studenta', 'Sponzor', 'Typ platby', 'Počet stravenek', 'Zdroj', 'Poznámky']
      const spRows = sponsorPayments.map(p => [
        'Sponzorská platba',
        new Date(p.paymentDate).toISOString().slice(0, 10),
        p.amount,
        p.currency,
        p.student ? `${p.student.lastName} ${p.student.firstName}` : '',
        p.student?.studentNo || '',
        p.sponsor ? `${p.sponsor.lastName} ${p.sponsor.firstName}` : '',
        p.paymentType,
        '',
        p.source || 'manual',
        p.notes || '',
      ])
      const vpRows = voucherPurchases.map(v => [
        'Stravenka',
        new Date(v.purchaseDate).toISOString().slice(0, 10),
        v.amount,
        v.currency,
        v.student ? `${v.student.lastName} ${v.student.firstName}` : '',
        v.student?.studentNo || '',
        v.sponsor ? `${v.sponsor.lastName} ${v.sponsor.firstName}` : (v.donorName || ''),
        '',
        v.count,
        v.source || 'manual',
        v.notes || '',
      ])

      csvContent = toCsv(headers, [...spRows, ...vpRows])
      fileName = `rael-payments-${dateStr}.csv`

    } else if (type === 'codelists') {
      const [classrooms, healthCheckTypes, paymentTypes, needTypes, equipmentTypes, wishTypes] = await Promise.all([
        prisma.classRoom.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.healthCheckType.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.paymentType.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.needType.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.equipmentType.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.wishType.findMany({ orderBy: { sortOrder: 'asc' } }),
      ])

      const headers = ['Typ číselníku', 'Název (CZ)', 'Název (EN)', 'Název (SW)', 'Cena (CZK)', 'Pořadí', 'Aktivní']

      const mapItems = (category: string, items: any[]) =>
        items.map(item => [
          category,
          item.name,
          item.nameEn || '',
          item.nameSw || '',
          item.price ?? '',
          item.sortOrder,
          item.isActive ? 'Ano' : 'Ne',
        ])

      const rows = [
        ...mapItems('Třídy', classrooms),
        ...mapItems('Zdravotní prohlídky', healthCheckTypes),
        ...mapItems('Typy plateb', paymentTypes),
        ...mapItems('Potřeby', needTypes),
        ...mapItems('Vybavení', equipmentTypes),
        ...mapItems('Přání', wishTypes),
      ]

      csvContent = toCsv(headers, rows)
      fileName = `rael-codelists-${dateStr}.csv`
    }

    // BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF'
    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error creating CSV export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
