import { prisma } from './db'

/**
 * Přepočítá stav předpisu školného (TuitionCharge) pro daného studenta.
 * Volat po vytvoření/úpravě/smazání SponsorPayment typu školné.
 */
export async function recalcTuitionStatus(studentId: string) {
  // Načíst všechny předpisy studenta
  const charges = await prisma.tuitionCharge.findMany({
    where: { studentId },
  })

  if (charges.length === 0) return

  // Načíst typy plateb → filtrovat "školné/tuition"
  const paymentTypes = await prisma.paymentType.findMany({ where: { isActive: true } })
  const tuitionTypeNames = paymentTypes
    .filter(pt => /školné|tuition|karo/i.test(pt.name + (pt.nameEn || '') + (pt.nameSw || '')))
    .map(pt => pt.name)

  for (const charge of charges) {
    const year = charge.period.split('-')[0]
    const startDate = new Date(`${year}-01-01T00:00:00Z`)
    const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`)

    // Součet plateb typu školné pro daného studenta v daném období a měně
    const payments = await prisma.sponsorPayment.findMany({
      where: {
        studentId: charge.studentId,
        paymentType: { in: tuitionTypeNames },
        paymentDate: { gte: startDate, lt: endDate },
        currency: charge.currency,
      },
      select: { amount: true },
    })

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)

    let status: string
    if (paidAmount <= 0) {
      status = 'UNPAID'
    } else if (paidAmount >= charge.amount) {
      status = 'PAID'
    } else {
      status = 'PARTIAL'
    }

    if (status !== charge.status) {
      await prisma.tuitionCharge.update({
        where: { id: charge.id },
        data: { status },
      })
    }
  }
}

/**
 * Zjistí, zda je daný paymentType typu školné.
 */
export function isTuitionType(paymentTypeName: string): boolean {
  return /školné|tuition|karo/i.test(paymentTypeName)
}
