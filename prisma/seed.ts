import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Načtení reálných dat ze souboru
const studentsJsonPath = join(__dirname, '..', 'data', 'students-real.json')
const rawData = JSON.parse(readFileSync(studentsJsonPath, 'utf-8'))
const studentsData: Array<{
  no: number
  firstName: string
  lastName: string
  dob: string
  gender: string | null
  class: string | null
  school: string | null
  sponsors: string[]
  sponsorNote?: string
  orphanStatus: string | null
  healthStatus: string | null
  familyNotes: string
  siblings: Array<{ no: number; name: string }>
  siblingGroup: string | null
  itemsReceived: string[]
  dentistChecks: string[]
  schoolFee?: string
  notes: string | null
  status?: string
}> = rawData.students

// Pomocná funkce: vytvoří unikátní email ze jména sponzora
function sponsorNameToEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstraní diakritiku
    .replace(/[^a-z0-9\s]/g, '')     // odstraní speciální znaky
    .trim()
    .replace(/\s+/g, '.')            // mezery na tečky
    + '@sponsor.rael.school'
}

// Pomocná funkce: rozdělit jméno na firstName a lastName
function splitSponsorName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function main() {
  console.log('🌱 Seeding database with REAL data...')
  console.log(`📂 Loaded ${studentsData.length} students from ${studentsJsonPath}`)

  // ============================================================
  // 1. VYČIŠTĚNÍ DATABÁZE
  // ============================================================

  console.log('🗑️  Clearing existing data...')
  await prisma.volunteerAssignment.deleteMany()
  await prisma.sponsorPayment.deleteMany()
  await prisma.sponsorship.deleteMany()
  await prisma.healthCheck.deleteMany()
  await prisma.voucherUsage.deleteMany()
  await prisma.voucherPurchase.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.need.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()
  await prisma.classRoom.deleteMany()
  await prisma.healthCheckType.deleteMany()
  await prisma.paymentType.deleteMany()
  await prisma.wish.deleteMany()
  await prisma.wishType.deleteMany()
  await prisma.needType.deleteMany()
  await prisma.equipmentType.deleteMany()
  console.log('✅ Database cleared')

  // ============================================================
  // 2. ČÍSELNÍKY (ClassRooms, HealthCheckTypes, PaymentTypes)
  // ============================================================

  // --- Třídy (ponecháno, přidány překlady) ---
  const classRooms = [
    { name: 'PP1', nameEn: 'PP1', nameSw: 'PP1' },
    { name: 'PP2', nameEn: 'PP2', nameSw: 'PP2' },
    { name: 'Grade 1', nameEn: 'Grade 1', nameSw: 'Daraja la 1' },
    { name: 'Grade 2', nameEn: 'Grade 2', nameSw: 'Daraja la 2' },
    { name: 'Grade 3', nameEn: 'Grade 3', nameSw: 'Daraja la 3' },
    { name: 'Grade 4', nameEn: 'Grade 4', nameSw: 'Daraja la 4' },
    { name: 'Grade 5', nameEn: 'Grade 5', nameSw: 'Daraja la 5' },
    { name: 'Grade 6', nameEn: 'Grade 6', nameSw: 'Daraja la 6' },
    { name: 'Grade 7', nameEn: 'Grade 7', nameSw: 'Daraja la 7' },
    { name: 'Grade 8', nameEn: 'Grade 8', nameSw: 'Daraja la 8' },
    { name: 'Grade 9', nameEn: 'Grade 9', nameSw: 'Daraja la 9' },
    { name: 'Grade 10', nameEn: 'Grade 10', nameSw: 'Daraja la 10' },
    { name: 'Grade 11', nameEn: 'Grade 11', nameSw: 'Daraja la 11' },
    { name: 'Grade 12', nameEn: 'Grade 12', nameSw: 'Daraja la 12' },
  ]
  for (let i = 0; i < classRooms.length; i++) {
    await prisma.classRoom.create({
      data: { name: classRooms[i].name, nameEn: classRooms[i].nameEn, nameSw: classRooms[i].nameSw, sortOrder: i },
    })
  }
  console.log('✅ ClassRooms seeded (' + classRooms.length + ')')

  // --- Zdravotní prohlídky (ponecháno, přidány překlady) ---
  const healthCheckTypes = [
    { name: 'Zdravotní', nameEn: 'General health', nameSw: 'Afya ya jumla' },
    { name: 'Zubař', nameEn: 'Dentist', nameSw: 'Daktari wa meno' },
    { name: 'Urgent', nameEn: 'Urgent', nameSw: 'Dharura' },
  ]
  for (let i = 0; i < healthCheckTypes.length; i++) {
    await prisma.healthCheckType.create({
      data: { name: healthCheckTypes[i].name, nameEn: healthCheckTypes[i].nameEn, nameSw: healthCheckTypes[i].nameSw, sortOrder: i },
    })
  }
  console.log('✅ HealthCheckTypes seeded (' + healthCheckTypes.length + ')')

  // --- Typy plateb (ponecháno, přidány překlady) ---
  const paymentTypes = [
    { name: 'Stravenky', nameEn: 'Meal vouchers', nameSw: 'Vocha za chakula' },
    { name: 'Platba za kávu', nameEn: 'Coffee payment', nameSw: 'Malipo ya kahawa' },
    { name: 'Školné', nameEn: 'Tuition', nameSw: 'Karo' },
    { name: 'Ordinace', nameEn: 'Clinic', nameSw: 'Kliniki' },
    { name: 'Taneční klub', nameEn: 'Dance club', nameSw: 'Klabu ya dansi' },
    { name: 'Semináře', nameEn: 'Seminars', nameSw: 'Semina' },
  ]
  for (let i = 0; i < paymentTypes.length; i++) {
    await prisma.paymentType.create({
      data: { name: paymentTypes[i].name, nameEn: paymentTypes[i].nameEn, nameSw: paymentTypes[i].nameSw, sortOrder: i },
    })
  }
  console.log('✅ PaymentTypes seeded (' + paymentTypes.length + ')')

  // --- Potřeby (nová data s překlady) ---
  const needTypes = [
    { name: 'Školní batoh', nameEn: 'School backpack', nameSw: 'Begi la shule', price: 300 },
    { name: 'Školní boty', nameEn: 'School shoes', nameSw: 'Viatu vya shule', price: 550 },
    { name: 'Školní uniforma', nameEn: 'School uniform', nameSw: 'Sare ya shule', price: 300 },
    { name: 'Školní svetr', nameEn: 'School sweater', nameSw: 'Sweta ya shule', price: 300 },
    { name: 'Komplet balík věcí na spaní', nameEn: 'Complete sleeping kit', nameSw: 'Pakiti kamili ya kulala', price: 1200 },
    { name: 'Jen moskytiéra', nameEn: 'Mosquito net only', nameSw: 'Chandarua tu', price: 200 },
    { name: 'Jen deka', nameEn: 'Blanket only', nameSw: 'Blanketi tu', price: 200 },
    { name: 'Jen matrace', nameEn: 'Mattress only', nameSw: 'Godoro tu', price: 500 },
    { name: 'Jen prostěradlo', nameEn: 'Bed sheet only', nameSw: 'Shuka tu', price: 100 },
    { name: 'Jen polštář', nameEn: 'Pillow only', nameSw: 'Mto tu', price: 200 },
    { name: 'Školní atlas', nameEn: 'School atlas', nameSw: 'Atlasi ya shule', price: 300 },
    { name: 'Slovník anglický', nameEn: 'English dictionary', nameSw: 'Kamusi ya Kiingereza', price: 250 },
    { name: 'Slovník svahilský', nameEn: 'Swahili dictionary', nameSw: 'Kamusi ya Kiswahili', price: 250 },
    { name: 'Kalkulačka', nameEn: 'Calculator', nameSw: 'Kikokotoo', price: 250 },
    { name: 'Matematický set', nameEn: 'Math set', nameSw: 'Seti ya hesabu', price: 50 },
    { name: 'Sportovní úbor', nameEn: 'Sports outfit', nameSw: 'Mavazi ya michezo', price: 400 },
    { name: 'Bible do školy', nameEn: 'School Bible', nameSw: 'Biblia ya shule', price: 300 },
    { name: 'Několik párů ponožek', nameEn: 'Several pairs of socks', nameSw: 'Jozi kadhaa za soksi', price: 200 },
    { name: '10 velkých sešitů', nameEn: '10 large notebooks', nameSw: 'Madaftari 10 makubwa', price: 200 },
  ]
  for (let i = 0; i < needTypes.length; i++) {
    await prisma.needType.create({
      data: { name: needTypes[i].name, nameEn: needTypes[i].nameEn, nameSw: needTypes[i].nameSw, price: needTypes[i].price, sortOrder: i },
    })
  }
  console.log('✅ NeedTypes seeded (' + needTypes.length + ')')

  // --- Vybavení (NOVÁ data — nahrazeno 6 položkami s cenami a překlady) ---
  const equipmentTypes = [
    { name: 'Moskytiéra', nameEn: 'Mosquito net', nameSw: 'Chandarua', price: 200 },
    { name: 'Postel', nameEn: 'Bed', nameSw: 'Kitanda', price: 0 },
    { name: 'Deka', nameEn: 'Blanket', nameSw: 'Blanketi', price: 200 },
    { name: 'Matrace', nameEn: 'Mattress', nameSw: 'Godoro', price: 500 },
    { name: 'Prostěradlo', nameEn: 'Bed sheet', nameSw: 'Shuka', price: 100 },
    { name: 'Polštář', nameEn: 'Pillow', nameSw: 'Mto', price: 200 },
  ]
  for (let i = 0; i < equipmentTypes.length; i++) {
    await prisma.equipmentType.create({
      data: { name: equipmentTypes[i].name, nameEn: equipmentTypes[i].nameEn, nameSw: equipmentTypes[i].nameSw, price: equipmentTypes[i].price, sortOrder: i },
    })
  }
  console.log('✅ EquipmentTypes seeded (' + equipmentTypes.length + ')')

  // --- Přání (nová data s překlady) ---
  const wishTypes = [
    { name: 'Narozeninový dort', nameEn: 'Birthday cake', nameSw: 'Keki ya kuzaliwa', price: 450 },
    { name: 'Kopačky', nameEn: 'Football boots', nameSw: 'Viatu vya mpira', price: 600 },
    { name: 'Kolo', nameEn: 'Bicycle', nameSw: 'Baiskeli', price: 4000 },
    { name: 'Postel', nameEn: 'Bed', nameSw: 'Kitanda', price: 1000 },
    { name: 'Sladkosti do 100 Kč', nameEn: 'Sweets up to 100 CZK', nameSw: 'Pipi hadi 100 CZK', price: 100 },
    { name: 'Sladkosti do 200 Kč', nameEn: 'Sweets up to 200 CZK', nameSw: 'Pipi hadi 200 CZK', price: 200 },
    { name: 'Sladkosti do 300 Kč', nameEn: 'Sweets up to 300 CZK', nameSw: 'Pipi hadi 300 CZK', price: 300 },
    { name: 'Sladkosti do 400 Kč', nameEn: 'Sweets up to 400 CZK', nameSw: 'Pipi hadi 400 CZK', price: 400 },
    { name: 'Sladkosti do 500 Kč', nameEn: 'Sweets up to 500 CZK', nameSw: 'Pipi hadi 500 CZK', price: 500 },
    { name: 'Oblečení za 500 Kč', nameEn: 'Clothes for 500 CZK', nameSw: 'Nguo za 500 CZK', price: 500 },
    { name: 'Oblečení za 1 000 Kč', nameEn: 'Clothes for 1 000 CZK', nameSw: 'Nguo za 1 000 CZK', price: 1000 },
  ]
  for (let i = 0; i < wishTypes.length; i++) {
    await prisma.wishType.create({
      data: { name: wishTypes[i].name, nameEn: wishTypes[i].nameEn, nameSw: wishTypes[i].nameSw, price: wishTypes[i].price, sortOrder: i },
    })
  }
  console.log('✅ WishTypes seeded (' + wishTypes.length + ')')

  // ============================================================
  // 3. UŽIVATELÉ — Admin, Manager, Dobrovolníci
  // ============================================================

  const passwordHash = await bcrypt.hash('admin123', 10)
  const managerHash = await bcrypt.hash('manager123', 10)
  const sponsorHash = await bcrypt.hash('sponsor123', 10)
  const volunteerHash = await bcrypt.hash('volunteer123', 10)

  await prisma.user.create({
    data: {
      email: 'admin@rael.school',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Rael',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin: admin@rael.school')

  await prisma.user.create({
    data: {
      email: 'manager@rael.school',
      password: managerHash,
      firstName: 'Manager',
      lastName: 'Rael',
      role: 'MANAGER',
    },
  })
  console.log('✅ Manager: manager@rael.school')

  const volunteersData = [
    { email: 'volunteer@rael.school', firstName: 'Petra', lastName: 'Svobodová' },
    { email: 'volunteer2@rael.school', firstName: 'Jakub', lastName: 'Novotný' },
    { email: 'volunteer3@rael.school', firstName: 'Tereza', lastName: 'Pokorná' },
  ]
  for (const v of volunteersData) {
    await prisma.user.create({
      data: {
        email: v.email,
        password: volunteerHash,
        firstName: v.firstName,
        lastName: v.lastName,
        role: 'VOLUNTEER',
      },
    })
  }
  console.log('✅ Volunteers seeded (' + volunteersData.length + ')')

  // ============================================================
  // 4. SPONZOŘI — vytvořit unikátní z reálných dat
  // ============================================================

  // Sebrat všechna unikátní jména sponzorů ze studentů
  const sponsorNamesSet = new Set<string>()
  for (const s of studentsData) {
    for (const sponsorName of s.sponsors) {
      sponsorNamesSet.add(sponsorName)
    }
  }

  const sponsorMap: Record<string, string> = {} // name -> userId
  let sponsorCount = 0

  for (const name of sponsorNamesSet) {
    const email = sponsorNameToEmail(name)
    const { firstName, lastName } = splitSponsorName(name)

    const user = await prisma.user.create({
      data: {
        email,
        password: sponsorHash,
        firstName,
        lastName,
        role: 'SPONSOR',
      },
    })
    sponsorMap[name] = user.id
    sponsorCount++
  }
  console.log('✅ Sponsors seeded (' + sponsorCount + ' unique)')

  // ============================================================
  // 5. STUDENTI — import 148 reálných studentů
  // ============================================================

  const studentIdMap: Record<number, string> = {} // no -> prisma id

  for (const s of studentsData) {
    const studentNo = `RAEL-${s.no.toString().padStart(3, '0')}`

    // Sestavit className pro Prisma (normalizovat na ClassRoom tabulku)
    let className = s.class
    // Třídy jako "Form 3", "Senior Secondary", "Completed Form 4" atd.
    // nechám tak jak jsou — ClassRoom je jen dropdown, className je volné pole

    // Sestavit siblings string
    const siblingsStr = s.siblings.length > 0
      ? s.siblings.map(sib => `#${sib.no} ${sib.name}`).join(', ')
      : null

    // Sestavit notes — kombinace familyNotes, notes a dalších info
    const notesParts: string[] = []
    if (s.familyNotes) notesParts.push(s.familyNotes)
    if (s.notes) notesParts.push(s.notes)
    if (s.itemsReceived.length > 0) notesParts.push('Přijaté předměty: ' + s.itemsReceived.join(', '))
    if (s.dentistChecks.length > 0) notesParts.push('Zubní prohlídky: ' + s.dentistChecks.join(', '))
    if (s.schoolFee) notesParts.push('Školné: ' + s.schoolFee)
    if (s.status === 'special') notesParts.push('SPECIÁLNÍ STATUS — nechodí do školy')
    if (s.status === 'completed') notesParts.push('DOKONČIL/A ŠKOLU')
    const notesStr = notesParts.length > 0 ? notesParts.join(' | ') : null

    const student = await prisma.student.create({
      data: {
        studentNo,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: s.dob ? new Date(s.dob) : null,
        gender: s.gender,
        className,
        school: s.school || 'Rael',
        orphanStatus: s.orphanStatus,
        healthStatus: s.healthStatus,
        siblings: siblingsStr,
        notes: notesStr,
        isActive: s.status !== 'completed',
      },
    })

    studentIdMap[s.no] = student.id
  }
  console.log('✅ Students seeded (' + studentsData.length + ')')

  // ============================================================
  // 6. SPONZORSTVÍ — propojení sponzorů se studenty
  // ============================================================

  let sponsorshipCount = 0
  for (const s of studentsData) {
    const studentId = studentIdMap[s.no]
    if (!studentId) continue

    for (const sponsorName of s.sponsors) {
      const sponsorId = sponsorMap[sponsorName]
      if (!sponsorId) continue

      await prisma.sponsorship.create({
        data: {
          studentId,
          userId: sponsorId,
          startDate: new Date('2024-01-01'),
          notes: s.sponsorNote || null,
          isActive: true,
        },
      })
      sponsorshipCount++
    }
  }
  console.log('✅ Sponsorships seeded (' + sponsorshipCount + ')')

  // ============================================================
  // 7. VYBAVENÍ — z itemsReceived
  // ============================================================

  let equipmentCount = 0
  for (const s of studentsData) {
    const studentId = studentIdMap[s.no]
    if (!studentId) continue

    for (const item of s.itemsReceived) {
      // Rozpoznat typ vybavení (nové české názvy)
      const itemLower = item.toLowerCase()
      let type = 'Postel'
      if (itemLower.includes('net') || itemLower.includes('mosquito')) type = 'Moskytiéra'
      else if (itemLower.includes('mattress') || itemLower.includes('matr')) type = 'Matrace'
      else if (itemLower.includes('blanket') || itemLower.includes('deka')) type = 'Deka'
      else if (itemLower.includes('sheet') || itemLower.includes('prostěr')) type = 'Prostěradlo'
      else if (itemLower.includes('pillow')) type = 'Polštář'
      else if (itemLower.includes('bedding') || itemLower.includes('bed')) type = 'Postel'

      // Zkusit extrahovat datum z položky (formát "item (DD/MM/YYYY)")
      const dateMatch = item.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/) || item.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
      let acquiredAt: Date | null = null
      if (dateMatch) {
        const parts = dateMatch[1].split('/')
        acquiredAt = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
      }

      await prisma.equipment.create({
        data: {
          studentId,
          type,
          condition: 'received',
          acquiredAt,
          notes: item,
        },
      })
      equipmentCount++
    }
  }
  console.log('✅ Equipment seeded (' + equipmentCount + ')')

  // ============================================================
  // 8. ZDRAVOTNÍ PROHLÍDKY — z dentistChecks
  // ============================================================

  let healthCheckCount = 0
  for (const s of studentsData) {
    const studentId = studentIdMap[s.no]
    if (!studentId) continue

    for (const check of s.dentistChecks) {
      // check může být "2023", "2024-01", "January 2024" atd.
      let checkDate: Date
      if (check.match(/^\d{4}$/)) {
        checkDate = new Date(`${check}-06-15`) // střed roku
      } else if (check.match(/^\d{4}-\d{2}$/)) {
        checkDate = new Date(`${check}-15`)
      } else {
        checkDate = new Date(check)
      }

      await prisma.healthCheck.create({
        data: {
          studentId,
          checkDate,
          checkType: 'Zubař',
          notes: 'Zubní prohlídka ' + check,
        },
      })
      healthCheckCount++
    }
  }
  console.log('✅ Health checks seeded (' + healthCheckCount + ')')

  // ============================================================
  // SOUHRN
  // ============================================================

  // Spočítat studenty bez sponzora
  const withoutSponsor = studentsData.filter(s => s.sponsors.length === 0)

  console.log('')
  console.log('🎉 Database seeded successfully with REAL data!')
  console.log('')
  console.log('📊 Souhrn:')
  console.log('   Třídy:               ' + classRooms.length)
  console.log('   Typy prohlídek:      ' + healthCheckTypes.length)
  console.log('   Typy plateb:         ' + paymentTypes.length)
  console.log('   Typy potřeb:        ' + needTypes.length)
  console.log('   Typy přání:         ' + wishTypes.length)
  console.log('   Studenti:            ' + studentsData.length)
  console.log('   Sponzoři:            ' + sponsorCount)
  console.log('   Dobrovolníci:        ' + volunteersData.length)
  console.log('   Sponzorství:         ' + sponsorshipCount)
  console.log('   Vybavení:            ' + equipmentCount)
  console.log('   Zdravotní prohlídky: ' + healthCheckCount)
  console.log('')
  console.log('⚠️  Studenti BEZ sponzora (' + withoutSponsor.length + '):')
  for (const s of withoutSponsor) {
    console.log(`   #${s.no} ${s.firstName} ${s.lastName}`)
  }
  console.log('')
  console.log('📋 Přihlašovací údaje:')
  console.log('   Admin:       admin@rael.school / admin123')
  console.log('   Manager:     manager@rael.school / manager123')
  console.log('   Sponzor:     <jmeno.prijmeni>@sponsor.rael.school / sponsor123')
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
