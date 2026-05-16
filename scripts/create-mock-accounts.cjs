const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding provided mock accounts...')

  try {
    const superAdminEmail = 'Adebayosamuel015@gmail.com'
    const superAdminPassword = 'Hibilero@2104'

    const existingSuper = await prisma.user.findUnique({ where: { email: superAdminEmail } })
    if (!existingSuper) {
      const hashed = await bcrypt.hash(superAdminPassword, 10)
      const user = await prisma.user.create({
        data: {
          email: superAdminEmail,
          fullName: 'Adebayo Samuel',
          password: hashed,
          role: 'SUPER_ADMIN'
        }
      })
      console.log('✅ Created SUPER_ADMIN:', user.email)
    } else {
      console.log('ℹ️ SUPER_ADMIN already exists:', superAdminEmail)
    }

    const schoolShort = 'lvl'
    let school = await prisma.school.findUnique({ where: { shortCode: schoolShort } })
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'laterna',
          shortCode: schoolShort,
          address: 'Ijebu-Igbo',
          principal: 'N/A',
          motto: 'Excellence',
        }
      })
      console.log('✅ Created school:', school.name)
    } else {
      console.log('ℹ️ School already exists:', school.name)
    }

    const adminEmail = 'samuela@laternabooks.ng'
    const adminPassword = 'Laterna@1234'

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 10)
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Samuel A',
          password: hashed,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id
        }
      })
      console.log('✅ Created SCHOOL_ADMIN:', admin.email)
    } else {
      console.log('ℹ️ SCHOOL_ADMIN already exists:', adminEmail)
    }

    const studentEmail = 'adebayosulaimansamuel@gmail.com'
    const studentPassword = 'Student@1234'
    const studentNumber = '0001'

    const existingStudent = await prisma.user.findUnique({ where: { email: studentEmail } })
    if (!existingStudent) {
      const hashed = await bcrypt.hash(studentPassword, 10)
      const studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          fullName: 'Paul John',
          password: hashed,
          role: 'STUDENT',
          schoolId: school.id,
          student: {
            create: {
              studentNo: `STU-${school.shortCode}-${studentNumber}`,
              schoolId: school.id,
              parentName: 'Mr and Mrs Adebayo',
              parentEmail: 'adebayosulaimansamuel@gmail.com',
              address: 'Ijebu-Igbo'
            }
          }
        }
      })
      console.log('✅ Created STUDENT user:', studentUser.email)
      console.log('   Student number:', `STU-${school.shortCode}-${studentNumber}`)
    } else {
      console.log('ℹ️ STUDENT already exists:', studentEmail)
    }

    console.log('\n✅ Provided mock accounts seeded.')
  } catch (err) {
    console.error('❌ Error seeding mock accounts:', err)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
