import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      students,
      users,
      equipment,
      needs,
      wishes,
      photos,
      voucherPurchases,
      voucherUsages,
      sponsorships,
      healthChecks,
      payments,
      sponsorPayments,
      volunteerAssignments,
      classrooms,
      healthCheckTypes,
      paymentTypes,
      needTypes,
      equipmentTypes,
      wishTypes,
      paymentImports,
      paymentImportRows,
    ] = await Promise.all([
      prisma.student.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, variableSymbol: true, bankAccount: true, createdAt: true, updatedAt: true } }),
      prisma.equipment.findMany(),
      prisma.need.findMany(),
      prisma.wish.findMany(),
      prisma.photo.findMany(),
      prisma.voucherPurchase.findMany(),
      prisma.voucherUsage.findMany(),
      prisma.sponsorship.findMany(),
      prisma.healthCheck.findMany(),
      prisma.payment.findMany(),
      prisma.sponsorPayment.findMany(),
      prisma.volunteerAssignment.findMany(),
      prisma.classRoom.findMany(),
      prisma.healthCheckType.findMany(),
      prisma.paymentType.findMany(),
      prisma.needType.findMany(),
      prisma.equipmentType.findMany(),
      prisma.wishType.findMany(),
      prisma.paymentImport.findMany(),
      prisma.paymentImportRow.findMany(),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        students,
        users,
        equipment,
        needs,
        wishes,
        photos,
        voucherPurchases,
        voucherUsages,
        sponsorships,
        healthChecks,
        payments,
        sponsorPayments,
        volunteerAssignments,
        classrooms,
        healthCheckTypes,
        paymentTypes,
        needTypes,
        equipmentTypes,
        wishTypes,
        paymentImports,
        paymentImportRows,
      },
      counts: {
        students: students.length,
        users: users.length,
        equipment: equipment.length,
        needs: needs.length,
        wishes: wishes.length,
        photos: photos.length,
        voucherPurchases: voucherPurchases.length,
        voucherUsages: voucherUsages.length,
        sponsorships: sponsorships.length,
        healthChecks: healthChecks.length,
        payments: payments.length,
        sponsorPayments: sponsorPayments.length,
        volunteerAssignments: volunteerAssignments.length,
        classrooms: classrooms.length,
        healthCheckTypes: healthCheckTypes.length,
        paymentTypes: paymentTypes.length,
        needTypes: needTypes.length,
        equipmentTypes: equipmentTypes.length,
        wishTypes: wishTypes.length,
        paymentImports: paymentImports.length,
        paymentImportRows: paymentImportRows.length,
      },
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const fileName = `rael-export-${dateStr}.json`

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error creating JSON export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
