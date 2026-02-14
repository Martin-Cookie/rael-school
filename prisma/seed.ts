import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // 1. ČÍSELNÍKY (ClassRooms, HealthCheckTypes, PaymentTypes)
  // ============================================================

  const classRoomNames = [
    'PP1',
    'PP2',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ]
  for (let i = 0; i < classRoomNames.length; i++) {
    await prisma.classRoom.upsert({
      where: { name: classRoomNames[i] },
      update: { sortOrder: i, isActive: true },
      create: { name: classRoomNames[i], sortOrder: i },
    })
  }
  console.log('✅ ClassRooms seeded (' + classRoomNames.length + ')')

  const healthCheckTypeNames = ['Zdravotní', 'Zubař', 'Urgent']
  for (let i = 0; i < healthCheckTypeNames.length; i++) {
    await prisma.healthCheckType.upsert({
      where: { name: healthCheckTypeNames[i] },
      update: { sortOrder: i, isActive: true },
      create: { name: healthCheckTypeNames[i], sortOrder: i },
    })
  }
  console.log('✅ HealthCheckTypes seeded (' + healthCheckTypeNames.length + ')')

  const paymentTypeNames = ['Stravenky', 'Platba za kávu', 'Školné', 'Ordinace', 'Taneční klub', 'Semináře']
  for (let i = 0; i < paymentTypeNames.length; i++) {
    await prisma.paymentType.upsert({
      where: { name: paymentTypeNames[i] },
      update: { sortOrder: i, isActive: true },
      create: { name: paymentTypeNames[i], sortOrder: i },
    })
  }
  console.log('✅ PaymentTypes seeded (' + paymentTypeNames.length + ')')

  // ============================================================
  // 2. UŽIVATELÉ (Admin, Manager, Sponzoři, Dobrovolníci)
  // ============================================================

  const passwordHash = await bcrypt.hash('admin123', 10)
  const managerHash = await bcrypt.hash('manager123', 10)
  const sponsorHash = await bcrypt.hash('sponsor123', 10)
  const volunteerHash = await bcrypt.hash('volunteer123', 10)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rael.school' },
    update: {},
    create: {
      email: 'admin@rael.school',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Rael',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin:', admin.email)

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@rael.school' },
    update: {},
    create: {
      email: 'manager@rael.school',
      password: managerHash,
      firstName: 'Manager',
      lastName: 'Rael',
      role: 'MANAGER',
    },
  })
  console.log('✅ Manager:', manager.email)

  // Sponzoři (15)
  const sponsorsData = [
    { email: 'sponsor@rael.school',      firstName: 'Jan',      lastName: 'Novák',       phone: '+420 777 123 456' },
    { email: 'petra.svobodova@email.cz',  firstName: 'Petra',    lastName: 'Svobodová',   phone: '+420 602 234 567' },
    { email: 'martin.dvorak@email.cz',    firstName: 'Martin',   lastName: 'Dvořák',      phone: '+420 731 345 678' },
    { email: 'eva.horakova@email.cz',     firstName: 'Eva',      lastName: 'Horáková',    phone: '+420 608 456 789' },
    { email: 'tomas.kriz@email.cz',       firstName: 'Tomáš',    lastName: 'Kříž',        phone: '+420 775 567 890' },
    { email: 'lucie.maresova@email.cz',   firstName: 'Lucie',    lastName: 'Marešová',    phone: '+420 604 678 901' },
    { email: 'josef.prochazka@email.cz',  firstName: 'Josef',    lastName: 'Procházka',   phone: '+420 739 789 012' },
    { email: 'anna.nemcova@email.cz',     firstName: 'Anna',     lastName: 'Němcová',     phone: '+420 606 890 123' },
    { email: 'david.cerny@email.cz',      firstName: 'David',    lastName: 'Černý',       phone: '+420 773 901 234' },
    { email: 'monika.vesela@email.cz',    firstName: 'Monika',   lastName: 'Veselá',      phone: '+420 601 012 345' },
    { email: 'pavel.kovar@email.cz',      firstName: 'Pavel',    lastName: 'Kovář',       phone: '+420 737 111 222' },
    { email: 'hana.polakova@email.cz',    firstName: 'Hana',     lastName: 'Poláková',    phone: '+420 605 222 333' },
    { email: 'jiri.fiala@email.cz',       firstName: 'Jiří',     lastName: 'Fiala',       phone: '+420 771 333 444' },
    { email: 'katerina.ruzickova@email.cz', firstName: 'Kateřina', lastName: 'Růžičková', phone: '+420 603 444 555' },
    { email: 'michal.urban@email.cz',     firstName: 'Michal',   lastName: 'Urban',       phone: '+420 735 555 666' },
  ]

  const sponsors: Record<string, { id: string }> = {}
  for (const s of sponsorsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: sponsorHash,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        role: 'SPONSOR',
      },
    })
    sponsors[s.email] = user
  }
  console.log('✅ Sponsors seeded (' + sponsorsData.length + ')')

  // Dobrovolníci (3)
  const volunteersData = [
    { email: 'volunteer@rael.school',       firstName: 'Petra',   lastName: 'Svobodová' },
    { email: 'volunteer2@rael.school',      firstName: 'Jakub',   lastName: 'Novotný' },
    { email: 'volunteer3@rael.school',      firstName: 'Tereza',  lastName: 'Pokorná' },
  ]

  const volunteers: Record<string, { id: string }> = {}
  for (const v of volunteersData) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        email: v.email,
        password: volunteerHash,
        firstName: v.firstName,
        lastName: v.lastName,
        role: 'VOLUNTEER',
      },
    })
    volunteers[v.email] = user
  }
  console.log('✅ Volunteers seeded (' + volunteersData.length + ')')

  // ============================================================
  // 3. STUDENTI (30) — s realistickými keňskými jmény
  //    Sourozenecké skupiny mají stejné příjmení a rodinné údaje
  // ============================================================

  const studentsData = [
    // --- Sourozenecká skupina 1: Ochieng ---
    { studentNo: 'RAEL-001', firstName: 'Amani',   lastName: 'Ochieng',  dob: '2015-03-15', gender: 'M', className: 'Grade 3', health: 'Dobrý', motherName: 'Grace Ochieng',  motherAlive: true,  fatherName: 'Peter Ochieng',   fatherAlive: false, siblings: '1 bratr, 1 sestra' },
    { studentNo: 'RAEL-002', firstName: 'Zawadi',  lastName: 'Ochieng',  dob: '2017-07-22', gender: 'F', className: 'Grade 1', health: 'Dobrý', motherName: 'Grace Ochieng',  motherAlive: true,  fatherName: 'Peter Ochieng',   fatherAlive: false, siblings: '1 bratr, 1 sestra' },
    { studentNo: 'RAEL-003', firstName: 'Kiprop',  lastName: 'Ochieng',  dob: '2019-11-01', gender: 'M', className: 'PP2',     health: 'Dobrý', motherName: 'Grace Ochieng',  motherAlive: true,  fatherName: 'Peter Ochieng',   fatherAlive: false, siblings: '1 bratr, 1 sestra' },

    // --- Sourozenecká skupina 2: Kipchoge ---
    { studentNo: 'RAEL-004', firstName: 'Baraka',  lastName: 'Kipchoge', dob: '2016-01-10', gender: 'M', className: 'Grade 2', health: 'Alergie',           motherName: 'Sarah Kipchoge', motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '2 sestry' },
    { studentNo: 'RAEL-005', firstName: 'Neema',   lastName: 'Kipchoge', dob: '2014-05-28', gender: 'F', className: 'Grade 4', health: 'Dobrý',             motherName: 'Sarah Kipchoge', motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '1 bratr, 1 sestra' },
    { studentNo: 'RAEL-006', firstName: 'Farida',  lastName: 'Kipchoge', dob: '2018-09-14', gender: 'F', className: 'PP2',     health: 'Dobrý',             motherName: 'Sarah Kipchoge', motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '1 bratr, 1 sestra' },

    // --- Sourozenecká skupina 3: Wafula ---
    { studentNo: 'RAEL-007', firstName: 'Jabari',  lastName: 'Wafula',   dob: '2013-11-05', gender: 'M', className: 'Grade 5', health: 'Zrakový problém',   motherName: null,             motherAlive: false, fatherName: 'David Wafula',    fatherAlive: true,  siblings: '1 sestra' },
    { studentNo: 'RAEL-008', firstName: 'Aisha',   lastName: 'Wafula',   dob: '2016-02-18', gender: 'F', className: 'Grade 2', health: 'Dobrý',             motherName: null,             motherAlive: false, fatherName: 'David Wafula',    fatherAlive: true,  siblings: '1 bratr' },

    // --- Sourozenecká skupina 4: Mwangi ---
    { studentNo: 'RAEL-009', firstName: 'Kamau',   lastName: 'Mwangi',   dob: '2015-09-18', gender: 'M', className: 'Grade 3', health: 'Dobrý',             motherName: 'Agnes Mwangi',   motherAlive: true,  fatherName: 'Samuel Mwangi',   fatherAlive: true,  siblings: '3 bratři' },
    { studentNo: 'RAEL-010', firstName: 'Njeri',   lastName: 'Mwangi',   dob: '2017-04-03', gender: 'F', className: 'Grade 1', health: 'Dobrý',             motherName: 'Agnes Mwangi',   motherAlive: true,  fatherName: 'Samuel Mwangi',   fatherAlive: true,  siblings: '3 bratři' },

    // --- Jednotlivci ---
    { studentNo: 'RAEL-011', firstName: 'Zuri',    lastName: 'Nyong\'o', dob: '2014-12-20', gender: 'F', className: 'Grade 4', health: 'Dobrý',             motherName: 'Faith Nyong\'o', motherAlive: true,  fatherName: 'James Nyong\'o', fatherAlive: true,  siblings: 'Žádní' },
    { studentNo: 'RAEL-012', firstName: 'Omari',   lastName: 'Mutua',    dob: '2016-06-07', gender: 'M', className: 'Grade 2', health: 'Astma',             motherName: 'Mercy Mutua',    motherAlive: true,  fatherName: 'John Mutua',      fatherAlive: false, siblings: '2 sestry' },
    { studentNo: 'RAEL-013', firstName: 'Imani',   lastName: 'Chepkoech',dob: '2015-08-11', gender: 'F', className: 'Grade 3', health: 'Dobrý',             motherName: 'Rose Chepkoech', motherAlive: true,  fatherName: 'Daniel Chepkoech',fatherAlive: true,  siblings: '1 bratr' },
    { studentNo: 'RAEL-014', firstName: 'Kofi',    lastName: 'Otieno',   dob: '2013-03-25', gender: 'M', className: 'Grade 5', health: 'Dobrý',             motherName: 'Mary Otieno',    motherAlive: false, fatherName: null,              fatherAlive: false, siblings: '1 sestra' },
    { studentNo: 'RAEL-015', firstName: 'Wanjiku', lastName: 'Kamau',    dob: '2018-01-30', gender: 'F', className: 'PP1',     health: 'Dobrý',             motherName: 'Lucy Kamau',     motherAlive: true,  fatherName: 'George Kamau',    fatherAlive: true,  siblings: 'Žádní' },
    { studentNo: 'RAEL-016', firstName: 'Tendai',  lastName: 'Njuguna',  dob: '2017-10-15', gender: 'M', className: 'Grade 1', health: 'Dobrý',             motherName: 'Jane Njuguna',   motherAlive: true,  fatherName: 'Patrick Njuguna', fatherAlive: true,  siblings: '2 bratři' },
    { studentNo: 'RAEL-017', firstName: 'Sakina',  lastName: 'Wekesa',   dob: '2016-04-22', gender: 'F', className: 'Grade 2', health: 'Kožní problém',     motherName: 'Esther Wekesa',  motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '1 bratr, 2 sestry' },
    { studentNo: 'RAEL-018', firstName: 'Daudi',   lastName: 'Kosgei',   dob: '2014-07-09', gender: 'M', className: 'Grade 4', health: 'Dobrý',             motherName: 'Gladys Kosgei',  motherAlive: true,  fatherName: 'William Kosgei',  fatherAlive: true,  siblings: '1 sestra' },
    { studentNo: 'RAEL-019', firstName: 'Hadiya',  lastName: 'Chebet',   dob: '2019-02-14', gender: 'F', className: 'PP1',     health: 'Dobrý',             motherName: 'Rebecca Chebet', motherAlive: true,  fatherName: 'Joseph Chebet',   fatherAlive: true,  siblings: 'Žádní' },
    { studentNo: 'RAEL-020', firstName: 'Simba',   lastName: 'Rotich',   dob: '2015-05-02', gender: 'M', className: 'Grade 3', health: 'Dobrý',             motherName: null,             motherAlive: false, fatherName: 'Michael Rotich',  fatherAlive: true,  siblings: '2 bratři, 1 sestra' },

    // --- Sourozenecká skupina 5: Kibet ---
    { studentNo: 'RAEL-021', firstName: 'Brian',   lastName: 'Kibet',    dob: '2013-08-20', gender: 'M', className: 'Grade 5', health: 'Dobrý',             motherName: 'Christine Kibet',motherAlive: true,  fatherName: 'Robert Kibet',    fatherAlive: false, siblings: '2 sestry' },
    { studentNo: 'RAEL-022', firstName: 'Mercy',   lastName: 'Kibet',    dob: '2015-12-05', gender: 'F', className: 'Grade 3', health: 'Dobrý',             motherName: 'Christine Kibet',motherAlive: true,  fatherName: 'Robert Kibet',    fatherAlive: false, siblings: '1 bratr, 1 sestra' },
    { studentNo: 'RAEL-023', firstName: 'Joy',     lastName: 'Kibet',    dob: '2018-06-17', gender: 'F', className: 'PP2',     health: 'Dobrý',             motherName: 'Christine Kibet',motherAlive: true,  fatherName: 'Robert Kibet',    fatherAlive: false, siblings: '1 bratr, 1 sestra' },

    { studentNo: 'RAEL-024', firstName: 'Victor',  lastName: 'Langat',   dob: '2016-03-08', gender: 'M', className: 'Grade 2', health: 'Dobrý',             motherName: 'Anne Langat',    motherAlive: true,  fatherName: 'Thomas Langat',   fatherAlive: true,  siblings: '1 bratr' },
    { studentNo: 'RAEL-025', firstName: 'Linet',   lastName: 'Sang',     dob: '2014-09-27', gender: 'F', className: 'Grade 4', health: 'Epilepsie',         motherName: 'Beatrice Sang',  motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '3 bratři' },
    { studentNo: 'RAEL-026', firstName: 'Felix',   lastName: 'Cherono',  dob: '2017-11-12', gender: 'M', className: 'Grade 1', health: 'Dobrý',             motherName: 'Margaret Cherono',motherAlive: true, fatherName: 'Stephen Cherono', fatherAlive: true,  siblings: 'Žádní' },
    { studentNo: 'RAEL-027', firstName: 'Sharon',  lastName: 'Kiptoo',   dob: '2019-04-05', gender: 'F', className: 'Baby Class', health: 'Dobrý',          motherName: 'Dorothy Kiptoo', motherAlive: true,  fatherName: 'Kevin Kiptoo',    fatherAlive: true,  siblings: '1 bratr' },
    { studentNo: 'RAEL-028', firstName: 'Dennis',  lastName: 'Ruto',     dob: '2015-07-21', gender: 'M', className: 'Grade 3', health: 'Sluchový problém',  motherName: 'Alice Ruto',     motherAlive: true,  fatherName: null,              fatherAlive: false, siblings: '1 sestra' },
    { studentNo: 'RAEL-029', firstName: 'Grace',   lastName: 'Yego',     dob: '2016-10-30', gender: 'F', className: 'Grade 2', health: 'Dobrý',             motherName: 'Susan Yego',     motherAlive: true,  fatherName: 'Andrew Yego',     fatherAlive: true,  siblings: '2 bratři' },
    { studentNo: 'RAEL-030', firstName: 'Kevin',   lastName: 'Bett',     dob: '2018-08-19', gender: 'M', className: 'PP1',     health: 'Dobrý',             motherName: null,             motherAlive: false, fatherName: 'Philip Bett',     fatherAlive: true,  siblings: '1 sestra' },
  ]

  const studentRecords: Record<string, { id: string }> = {}
  for (const s of studentsData) {
    const student = await prisma.student.upsert({
      where: { studentNo: s.studentNo },
      update: {},
      create: {
        studentNo: s.studentNo,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: new Date(s.dob),
        gender: s.gender,
        className: s.className,
        healthStatus: s.health,
        motherName: s.motherName,
        motherAlive: s.motherAlive,
        fatherName: s.fatherName,
        fatherAlive: s.fatherAlive,
        siblings: s.siblings,
      },
    })
    studentRecords[s.studentNo] = student
  }
  console.log('✅ Students seeded (' + studentsData.length + ')')

  // ============================================================
  // 4. SPONZORSTVÍ — přiřazení sponzorů ke studentům
  // ============================================================

  const sponsorshipAssignments: Array<{ studentNo: string; sponsorEmail: string; startDate: string; notes?: string }> = [
    { studentNo: 'RAEL-001', sponsorEmail: 'sponsor@rael.school',       startDate: '2024-01-01', notes: 'Hlavní sponzor' },
    { studentNo: 'RAEL-002', sponsorEmail: 'sponsor@rael.school',       startDate: '2024-01-01', notes: 'Sourozenec Amani' },
    { studentNo: 'RAEL-003', sponsorEmail: 'sponsor@rael.school',       startDate: '2024-03-01' },
    { studentNo: 'RAEL-004', sponsorEmail: 'petra.svobodova@email.cz',  startDate: '2024-02-01' },
    { studentNo: 'RAEL-005', sponsorEmail: 'petra.svobodova@email.cz',  startDate: '2024-02-01', notes: 'Sourozenec Baraky' },
    { studentNo: 'RAEL-006', sponsorEmail: 'martin.dvorak@email.cz',    startDate: '2024-06-01' },
    { studentNo: 'RAEL-007', sponsorEmail: 'eva.horakova@email.cz',     startDate: '2024-01-15' },
    { studentNo: 'RAEL-008', sponsorEmail: 'eva.horakova@email.cz',     startDate: '2024-01-15', notes: 'Sourozenec Jabariho' },
    { studentNo: 'RAEL-009', sponsorEmail: 'tomas.kriz@email.cz',       startDate: '2024-03-01' },
    { studentNo: 'RAEL-010', sponsorEmail: 'tomas.kriz@email.cz',       startDate: '2024-03-01' },
    { studentNo: 'RAEL-011', sponsorEmail: 'lucie.maresova@email.cz',   startDate: '2024-04-01' },
    { studentNo: 'RAEL-012', sponsorEmail: 'josef.prochazka@email.cz',  startDate: '2024-02-15' },
    { studentNo: 'RAEL-013', sponsorEmail: 'anna.nemcova@email.cz',     startDate: '2024-05-01' },
    { studentNo: 'RAEL-014', sponsorEmail: 'david.cerny@email.cz',      startDate: '2024-01-01', notes: 'Sirotek — oba rodiče mrtví' },
    { studentNo: 'RAEL-015', sponsorEmail: 'monika.vesela@email.cz',    startDate: '2024-06-01' },
    { studentNo: 'RAEL-016', sponsorEmail: 'pavel.kovar@email.cz',      startDate: '2024-04-01' },
    { studentNo: 'RAEL-017', sponsorEmail: 'hana.polakova@email.cz',    startDate: '2024-03-15' },
    { studentNo: 'RAEL-018', sponsorEmail: 'jiri.fiala@email.cz',       startDate: '2024-05-01' },
    { studentNo: 'RAEL-019', sponsorEmail: 'katerina.ruzickova@email.cz', startDate: '2024-07-01' },
    { studentNo: 'RAEL-020', sponsorEmail: 'michal.urban@email.cz',     startDate: '2024-02-01' },
    { studentNo: 'RAEL-021', sponsorEmail: 'sponsor@rael.school',       startDate: '2024-01-01' },
    { studentNo: 'RAEL-022', sponsorEmail: 'petra.svobodova@email.cz',  startDate: '2024-04-01' },
    { studentNo: 'RAEL-023', sponsorEmail: 'martin.dvorak@email.cz',    startDate: '2024-06-01' },
    { studentNo: 'RAEL-024', sponsorEmail: 'lucie.maresova@email.cz',   startDate: '2024-05-01' },
    { studentNo: 'RAEL-025', sponsorEmail: 'anna.nemcova@email.cz',     startDate: '2024-03-01', notes: 'Epilepsie — potřeba pravidelných kontrol' },
    { studentNo: 'RAEL-026', sponsorEmail: 'david.cerny@email.cz',      startDate: '2024-07-01' },
    { studentNo: 'RAEL-028', sponsorEmail: 'josef.prochazka@email.cz',  startDate: '2024-04-01' },
    { studentNo: 'RAEL-029', sponsorEmail: 'monika.vesela@email.cz',    startDate: '2024-06-01' },
    { studentNo: 'RAEL-030', sponsorEmail: 'michal.urban@email.cz',     startDate: '2024-08-01' },
    // RAEL-027 (Sharon) zatím bez sponzora
  ]

  for (const a of sponsorshipAssignments) {
    const student = studentRecords[a.studentNo]
    const sponsor = sponsors[a.sponsorEmail]
    if (student && sponsor) {
      await prisma.sponsorship.create({
        data: {
          studentId: student.id,
          userId: sponsor.id,
          startDate: new Date(a.startDate),
          notes: a.notes || null,
        },
      })
    }
  }
  console.log('✅ Sponsorships seeded (' + sponsorshipAssignments.length + ')')

  // ============================================================
  // 5. VYBAVENÍ — každý student dostane 4 kusy
  // ============================================================

  const equipmentTypes = ['bed', 'mattress', 'blanket', 'mosquito_net'] as const
  const conditions = ['new', 'satisfactory', 'poor'] as const

  for (const s of studentsData) {
    const student = studentRecords[s.studentNo]
    if (!student) continue

    const eqData = equipmentTypes.map((type, i) => ({
      studentId: student.id,
      type,
      condition: conditions[i % conditions.length],
      acquiredAt: new Date(`2024-0${(i % 9) + 1}-15`),
    }))

    await prisma.equipment.createMany({ data: eqData })
  }
  console.log('✅ Equipment seeded (4 items × ' + studentsData.length + ' students)')

  // ============================================================
  // 6. POTŘEBY — náhodně 1-3 potřeby na studenta
  // ============================================================

  const needOptions = [
    'Nové školní boty',
    'Školní uniforma',
    'Sešity a tužky',
    'Školní taška',
    'Matematická sada (pravítko, kružítko)',
    'Deka na internát',
    'Hygienické potřeby',
    'Ponožky',
    'Sportovní oblečení',
    'Učebnice',
  ]

  let needCount = 0
  for (let i = 0; i < studentsData.length; i++) {
    const student = studentRecords[studentsData[i].studentNo]
    if (!student) continue

    const count = (i % 3) + 1 // 1-3 potřeb
    for (let j = 0; j < count; j++) {
      const needIdx = (i * 3 + j) % needOptions.length
      const isFulfilled = j === 0 && i % 4 === 0 // ~25% první potřeby splněno
      await prisma.need.create({
        data: {
          studentId: student.id,
          description: needOptions[needIdx],
          isFulfilled,
          fulfilledAt: isFulfilled ? new Date('2024-06-01') : null,
        },
      })
      needCount++
    }
  }
  console.log('✅ Needs seeded (' + needCount + ')')

  // ============================================================
  // 7. STRAVENKY — nákupy a čerpání
  // ============================================================

  let voucherPurchaseCount = 0
  let voucherUsageCount = 0

  for (let i = 0; i < studentsData.length; i++) {
    const student = studentRecords[studentsData[i].studentNo]
    if (!student) continue

    // Každý student má 2 nákupy stravenek
    await prisma.voucherPurchase.createMany({
      data: [
        {
          studentId: student.id,
          purchaseDate: new Date('2024-01-15'),
          amount: 5000,
          count: 50,
        },
        {
          studentId: student.id,
          purchaseDate: new Date('2024-07-01'),
          amount: 5000,
          count: 50,
        },
      ],
    })
    voucherPurchaseCount += 2

    // Měsíční čerpání stravenek (leden–červen 2024)
    const months = ['01', '02', '03', '04', '05', '06']
    const usageData = months.map((m) => ({
      studentId: student.id,
      usageDate: new Date(`2024-${m}-28`),
      count: 6 + (i % 5), // 6-10 stravenek měsíčně
    }))

    await prisma.voucherUsage.createMany({ data: usageData })
    voucherUsageCount += usageData.length
  }
  console.log('✅ Voucher purchases seeded (' + voucherPurchaseCount + ')')
  console.log('✅ Voucher usages seeded (' + voucherUsageCount + ')')

  // ============================================================
  // 8. ZDRAVOTNÍ PROHLÍDKY
  // ============================================================

  const checkTypes = ['Praktik', 'Zubař', 'Oční']
  let healthCheckCount = 0

  for (let i = 0; i < studentsData.length; i++) {
    const student = studentRecords[studentsData[i].studentNo]
    if (!student) continue

    // Každý student má 1-2 prohlídky
    const count = (i % 2) + 1
    for (let j = 0; j < count; j++) {
      const checkType = checkTypes[(i + j) % checkTypes.length]
      const month = ((i * 2 + j * 3) % 12) + 1
      const monthStr = month.toString().padStart(2, '0')

      const notesMap: Record<string, string> = {
        'Praktik': 'Vše v pořádku',
        'Zubař': i % 3 === 0 ? 'Jeden kaz — ošetřeno' : 'Bez nálezu',
        'Oční': i % 5 === 0 ? 'Doporučeny brýle' : 'Zrak v normě',
      }

      await prisma.healthCheck.create({
        data: {
          studentId: student.id,
          checkDate: new Date(`2024-${monthStr}-15`),
          checkType,
          notes: notesMap[checkType] || 'Bez nálezu',
        },
      })
      healthCheckCount++
    }
  }
  console.log('✅ Health checks seeded (' + healthCheckCount + ')')

  // ============================================================
  // 9. PLATBY (obecné)
  // ============================================================

  let paymentCount = 0
  for (let i = 0; i < studentsData.length; i++) {
    const student = studentRecords[studentsData[i].studentNo]
    if (!student) continue

    // 2 platby na studenta (Q1 a Q2)
    await prisma.payment.createMany({
      data: [
        {
          studentId: student.id,
          paymentDate: new Date('2024-01-10'),
          amount: 15000,
          notes: 'Sponzorský příspěvek Q1',
          source: 'manual',
        },
        {
          studentId: student.id,
          paymentDate: new Date('2024-04-10'),
          amount: 15000,
          notes: 'Sponzorský příspěvek Q2',
          source: 'manual',
        },
      ],
    })
    paymentCount += 2
  }
  console.log('✅ Payments seeded (' + paymentCount + ')')

  // ============================================================
  // 10. SPONZORSKÉ PLATBY
  // ============================================================

  const paymentTypes = ['Školné', 'Lékař', 'Uniforma', 'Učebnice']
  let sponsorPaymentCount = 0

  for (const a of sponsorshipAssignments) {
    const student = studentRecords[a.studentNo]
    const sponsor = sponsors[a.sponsorEmail]
    if (!student || !sponsor) continue

    // 1-2 sponzorské platby
    const startMonth = parseInt(a.startDate.split('-')[1])
    const pType = paymentTypes[sponsorPaymentCount % paymentTypes.length]

    await prisma.sponsorPayment.create({
      data: {
        studentId: student.id,
        sponsorId: sponsor.id,
        paymentDate: new Date(a.startDate),
        amount: pType === 'Školné' ? 25000 : pType === 'Uniforma' ? 5000 : pType === 'Učebnice' ? 3000 : 8000,
        currency: 'KES',
        paymentType: pType,
        notes: `Platba od sponzora — ${pType}`,
      },
    })
    sponsorPaymentCount++

    // Druhá platba pro některé (sudé indexy)
    if (sponsorPaymentCount % 2 === 0) {
      const secondMonth = Math.min(startMonth + 3, 12)
      await prisma.sponsorPayment.create({
        data: {
          studentId: student.id,
          sponsorId: sponsor.id,
          paymentDate: new Date(`2024-${secondMonth.toString().padStart(2, '0')}-15`),
          amount: 25000,
          currency: 'KES',
          paymentType: 'Školné',
          notes: 'Školné — další termín',
        },
      })
      sponsorPaymentCount++
    }
  }
  console.log('✅ Sponsor payments seeded (' + sponsorPaymentCount + ')')

  // ============================================================
  // 11. PŘIŘAZENÍ DOBROVOLNÍKŮ
  // ============================================================

  const volunteerAssignments = [
    { volunteerEmail: 'volunteer@rael.school',  studentNos: ['RAEL-001', 'RAEL-002', 'RAEL-003', 'RAEL-004', 'RAEL-005', 'RAEL-011', 'RAEL-012', 'RAEL-013', 'RAEL-014', 'RAEL-015'] },
    { volunteerEmail: 'volunteer2@rael.school', studentNos: ['RAEL-006', 'RAEL-007', 'RAEL-008', 'RAEL-009', 'RAEL-010', 'RAEL-016', 'RAEL-017', 'RAEL-018', 'RAEL-019', 'RAEL-020'] },
    { volunteerEmail: 'volunteer3@rael.school', studentNos: ['RAEL-021', 'RAEL-022', 'RAEL-023', 'RAEL-024', 'RAEL-025', 'RAEL-026', 'RAEL-027', 'RAEL-028', 'RAEL-029', 'RAEL-030'] },
  ]

  let volAssignCount = 0
  for (const va of volunteerAssignments) {
    const vol = volunteers[va.volunteerEmail]
    if (!vol) continue
    for (const sNo of va.studentNos) {
      const student = studentRecords[sNo]
      if (!student) continue
      await prisma.volunteerAssignment.create({
        data: { userId: vol.id, studentId: student.id },
      })
      volAssignCount++
    }
  }
  console.log('✅ Volunteer assignments seeded (' + volAssignCount + ')')

  // ============================================================
  // SOUHRN
  // ============================================================

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📊 Souhrn:')
  console.log('   Třídy:               ' + classRoomNames.length)
  console.log('   Typy prohlídek:      ' + healthCheckTypeNames.length)
  console.log('   Typy plateb:         ' + paymentTypeNames.length)
  console.log('   Studenti:            ' + studentsData.length)
  console.log('   Sponzoři:            ' + sponsorsData.length)
  console.log('   Dobrovolníci:        ' + volunteersData.length)
  console.log('   Sponzorství:         ' + sponsorshipAssignments.length)
  console.log('   Vybavení:            ' + (studentsData.length * 4))
  console.log('   Potřeby:             ' + needCount)
  console.log('   Nákupy stravenek:    ' + voucherPurchaseCount)
  console.log('   Čerpání stravenek:   ' + voucherUsageCount)
  console.log('   Zdravotní prohlídky: ' + healthCheckCount)
  console.log('   Platby:              ' + paymentCount)
  console.log('   Platby sponzorů:     ' + sponsorPaymentCount)
  console.log('   Přiřazení dobrovol.: ' + volAssignCount)
  console.log('')
  console.log('📋 Přihlašovací údaje:')
  console.log('   Admin:       admin@rael.school / admin123')
  console.log('   Manager:     manager@rael.school / manager123')
  console.log('   Sponzor:     sponsor@rael.school / sponsor123')
  console.log('   Dobrovolník: volunteer@rael.school / volunteer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
