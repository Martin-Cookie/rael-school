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
  console.log('✅ Database cleared')

  // ============================================================
  // 2. ČÍSELNÍKY (ClassRooms, HealthCheckTypes, PaymentTypes)
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
    await prisma.classRoom.create({
      data: { name: classRoomNames[i], sortOrder: i },
    })
  }
  console.log('✅ ClassRooms seeded (' + classRoomNames.length + ')')

  const healthCheckTypeNames = ['Zdravotní', 'Zubař', 'Urgent']
  for (let i = 0; i < healthCheckTypeNames.length; i++) {
    await prisma.healthCheckType.create({
      data: { name: healthCheckTypeNames[i], sortOrder: i },
    })
  }
  console.log('✅ HealthCheckTypes seeded (' + healthCheckTypeNames.length + ')')

  const paymentTypeNames = ['Stravenky', 'Platba za kávu', 'Školné', 'Ordinace', 'Taneční klub', 'Semináře']
  for (let i = 0; i < paymentTypeNames.length; i++) {
    await prisma.paymentType.create({
      data: { name: paymentTypeNames[i], sortOrder: i },
    })
  }
  console.log('✅ PaymentTypes seeded (' + paymentTypeNames.length + ')')

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
      // Rozpoznat typ vybavení
      const itemLower = item.toLowerCase()
      let type = 'other'
      if (itemLower.includes('bedding') || itemLower.includes('bed')) type = 'bedding'
      else if (itemLower.includes('mattress') || itemLower.includes('matr')) type = 'mattress'
      else if (itemLower.includes('blanket') || itemLower.includes('deka')) type = 'blanket'
      else if (itemLower.includes('net') || itemLower.includes('mosquito')) type = 'mosquito_net'
      else if (itemLower.includes('uniform')) type = 'uniform'
      else if (itemLower.includes('shoes') || itemLower.includes('boots')) type = 'shoes'
      else if (itemLower.includes('bag')) type = 'school_bag'
      else if (itemLower.includes('wheelchair')) type = 'wheelchair'
      else if (itemLower.includes('pillow')) type = 'pillow'
      else type = 'other'

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
  console.log('   Třídy:               ' + classRoomNames.length)
  console.log('   Typy prohlídek:      ' + healthCheckTypeNames.length)
  console.log('   Typy plateb:         ' + paymentTypeNames.length)
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
