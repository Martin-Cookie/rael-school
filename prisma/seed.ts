import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rael.school' },
    update: {},
    create: {
      email: 'admin@rael.school',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Rael',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@rael.school' },
    update: {},
    create: {
      email: 'manager@rael.school',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'Rael',
      role: 'MANAGER',
    },
  })
  console.log('✅ Manager user created:', manager.email)

  // Create sponsor user
  const sponsorPassword = await bcrypt.hash('sponsor123', 10)
  const sponsor = await prisma.user.upsert({
    where: { email: 'sponsor@example.com' },
    update: {},
    create: {
      email: 'sponsor@example.com',
      password: sponsorPassword,
      firstName: 'Jan',
      lastName: 'Novák',
      phone: '+420 777 123 456',
      role: 'SPONSOR',
    },
  })
  console.log('✅ Sponsor user created:', sponsor.email)

  // Create volunteer user
  const volunteerPassword = await bcrypt.hash('volunteer123', 10)
  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@example.com' },
    update: {},
    create: {
      email: 'volunteer@example.com',
      password: volunteerPassword,
      firstName: 'Petra',
      lastName: 'Svobodová',
      role: 'VOLUNTEER',
    },
  })
  console.log('✅ Volunteer user created:', volunteer.email)

  // Create sample students
  const students = [
    {
      studentNo: 'RAEL-001',
      firstName: 'Amani',
      lastName: 'Mwangi',
      dateOfBirth: new Date('2015-03-15'),
      gender: 'M',
      className: '3rd Grade',
      healthStatus: 'Dobrý / Good',
      motherName: 'Grace Mwangi',
      motherAlive: true,
      fatherName: 'Joseph Mwangi',
      fatherAlive: false,
      siblings: '2 bratři, 1 sestra / 2 brothers, 1 sister',
    },
    {
      studentNo: 'RAEL-002',
      firstName: 'Zawadi',
      lastName: 'Ochieng',
      dateOfBirth: new Date('2014-07-22'),
      gender: 'F',
      className: '4th Grade',
      healthStatus: 'Dobrý / Good',
      motherName: 'Mary Ochieng',
      motherAlive: true,
      fatherName: 'Peter Ochieng',
      fatherAlive: true,
      siblings: '1 bratr / 1 brother',
    },
    {
      studentNo: 'RAEL-003',
      firstName: 'Baraka',
      lastName: 'Kipchoge',
      dateOfBirth: new Date('2016-01-10'),
      gender: 'M',
      className: '2nd Grade',
      healthStatus: 'Alergie / Allergies',
      motherName: 'Sarah Kipchoge',
      motherAlive: true,
      fatherName: null,
      fatherAlive: false,
      siblings: '3 sestry / 3 sisters',
    },
    {
      studentNo: 'RAEL-004',
      firstName: 'Neema',
      lastName: 'Wafula',
      dateOfBirth: new Date('2013-11-05'),
      gender: 'F',
      className: '5th Grade',
      healthStatus: 'Dobrý / Good',
      motherName: 'Ruth Wafula',
      motherAlive: false,
      fatherName: 'David Wafula',
      fatherAlive: true,
      siblings: '1 bratr, 2 sestry / 1 brother, 2 sisters',
    },
    {
      studentNo: 'RAEL-005',
      firstName: 'Jabari',
      lastName: 'Kamau',
      dateOfBirth: new Date('2015-09-18'),
      gender: 'M',
      className: '3rd Grade',
      healthStatus: 'Zrakový problém / Vision problem',
      motherName: 'Agnes Kamau',
      motherAlive: true,
      fatherName: 'Samuel Kamau',
      fatherAlive: true,
      siblings: '4 bratři / 4 brothers',
    },
  ]

  for (const studentData of students) {
    const student = await prisma.student.upsert({
      where: { studentNo: studentData.studentNo },
      update: {},
      create: studentData,
    })
    console.log(`✅ Student created: ${student.firstName} ${student.lastName} (${student.studentNo})`)
  }

  // Add equipment for first student
  const student1 = await prisma.student.findUnique({ where: { studentNo: 'RAEL-001' } })
  if (student1) {
    await prisma.equipment.createMany({
      data: [
        { studentId: student1.id, type: 'bed', condition: 'satisfactory', acquiredAt: new Date('2024-01-15') },
        { studentId: student1.id, type: 'mattress', condition: 'new', acquiredAt: new Date('2024-06-01') },
        { studentId: student1.id, type: 'blanket', condition: 'poor', acquiredAt: new Date('2023-03-10') },
        { studentId: student1.id, type: 'mosquito_net', condition: 'new', acquiredAt: new Date('2024-06-01') },
      ],
    })
    console.log('✅ Equipment added for RAEL-001')

    // Add needs
    await prisma.need.createMany({
      data: [
        { studentId: student1.id, description: 'Nové školní boty / New school shoes', isFulfilled: false },
        { studentId: student1.id, description: 'Školní uniforma / School uniform', isFulfilled: true, fulfilledAt: new Date('2024-05-01') },
        { studentId: student1.id, description: 'Sešity a tužky / Notebooks and pencils', isFulfilled: false },
      ],
    })
    console.log('✅ Needs added for RAEL-001')

    // Add vouchers
    await prisma.voucherPurchase.createMany({
      data: [
        { studentId: student1.id, purchaseDate: new Date('2024-01-15'), amount: 5000, count: 50 },
        { studentId: student1.id, purchaseDate: new Date('2024-04-10'), amount: 3000, count: 30 },
      ],
    })
    await prisma.voucherUsage.createMany({
      data: [
        { studentId: student1.id, usageDate: new Date('2024-02-01'), count: 10 },
        { studentId: student1.id, usageDate: new Date('2024-03-01'), count: 15 },
        { studentId: student1.id, usageDate: new Date('2024-04-01'), count: 10 },
      ],
    })
    console.log('✅ Vouchers added for RAEL-001')

    // Add sponsorship
    await prisma.sponsorship.create({
      data: {
        studentId: student1.id,
        userId: sponsor.id,
        startDate: new Date('2024-01-01'),
        notes: 'Hlavní sponzor / Main sponsor',
      },
    })
    console.log('✅ Sponsorship added for RAEL-001')

    // Add health checks
    await prisma.healthCheck.createMany({
      data: [
        { studentId: student1.id, checkDate: new Date('2024-02-15'), checkType: 'general', notes: 'Vše v pořádku / All good' },
        { studentId: student1.id, checkDate: new Date('2024-05-20'), checkType: 'dentist', notes: 'Jeden kaz / One cavity' },
      ],
    })
    console.log('✅ Health checks added for RAEL-001')

    // Add payments
    await prisma.payment.createMany({
      data: [
        { studentId: student1.id, paymentDate: new Date('2024-01-10'), amount: 15000, notes: 'Sponzorský příspěvek Q1', source: 'manual' },
        { studentId: student1.id, paymentDate: new Date('2024-04-10'), amount: 15000, notes: 'Sponzorský příspěvek Q2', source: 'manual' },
      ],
    })
    console.log('✅ Payments added for RAEL-001')

    // Assign volunteer
    await prisma.volunteerAssignment.create({
      data: {
        userId: volunteer.id,
        studentId: student1.id,
      },
    })
    console.log('✅ Volunteer assigned to RAEL-001')
  }

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📋 Test login credentials:')
  console.log('   Admin:      admin@rael.school / admin123')
  console.log('   Manager:    manager@rael.school / manager123')
  console.log('   Sponsor:    sponsor@example.com / sponsor123')
  console.log('   Volunteer:  volunteer@example.com / volunteer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
