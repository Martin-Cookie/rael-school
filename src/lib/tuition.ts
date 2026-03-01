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

  // Batch-load: všechny platby školného pro studenta jedním dotazem
  const allPayments = tuitionTypeNames.length > 0 ? await prisma.sponsorPayment.findMany({
    where: {
      studentId,
      paymentType: { in: tuitionTypeNames },
    },
    select: { amount: true, paymentDate: true, currency: true },
  }) : []

  for (const charge of charges) {
    const year = charge.period.split('-')[0]
    const startDate = new Date(`${year}-01-01T00:00:00Z`)
    const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`)

    const paidAmount = allPayments
      .filter(p => p.currency === charge.currency && p.paymentDate >= startDate && p.paymentDate < endDate)
      .reduce((sum, p) => sum + p.amount, 0)

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
