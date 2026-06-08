const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('\n📋 CBT LOGIN DIAGNOSTICS\n')
  console.log('=' .repeat(60))

  // 1. Check environment
  console.log('\n1. ENVIRONMENT VARIABLES')
  console.log('-' .repeat(60))
  
  const envChecks = {
    'NODE_ENV': process.env.NODE_ENV || 'NOT SET (defaults to development)',
    'DATABASE_URL': process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET',
    'JWT_SECRET': process.env.JWT_SECRET ? `✅ SET (${process.env.JWT_SECRET.length} chars)` : '❌ NOT SET',
    'REQUIRE_EMAIL_VERIFICATION': process.env.REQUIRE_EMAIL_VERIFICATION || 'NOT SET (defaults to false)',
  }

  for (const [key, val] of Object.entries(envChecks)) {
    console.log(`  ${key.padEnd(25)}: ${val}`)
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.log('\n  ⚠️  WARNING: JWT_SECRET too short or missing (min 32 chars)')
  }

  if (!process.env.DATABASE_URL) {
    console.log('\n  ❌ ERROR: DATABASE_URL not set!')
    console.log('  → Add DATABASE_URL to .env.local or environment')
    return
  }

  // 2. Test database connection
  console.log('\n2. DATABASE CONNECTION')
  console.log('-' .repeat(60))
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('  ✅ Database connection successful')
  } catch (err) {
    console.log(`  ❌ Database connection failed: ${err.message}`)
    return
  }

  // 3. Check seeded users
  console.log('\n3. SEEDED TEST USERS')
  console.log('-' .repeat(60))

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        student: { select: { studentNo: true } },
        teacher: { select: { employeeNo: true } },
      },
    })

    if (users.length === 0) {
      console.log('  ❌ NO USERS FOUND!')
      console.log('  → Run: npm run seed:mock')
      return
    }

    for (const user of users) {
      const studentNo = user.student?.studentNo || ''
      const teacherNo = user.teacher?.employeeNo || ''
      const verification = user.emailVerified ? '✅' : '❌'
      console.log(`  ${verification} [${user.role.padEnd(12)}] ${user.email.padEnd(35)} ${studentNo}${teacherNo}`)
    }

    // 4. Check schools
    console.log('\n4. SCHOOLS')
    console.log('-' .repeat(60))
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, shortCode: true, _count: { select: { students: true, teachers: true } } },
    })

    if (schools.length === 0) {
      console.log('  ⚠️  NO SCHOOLS FOUND')
    } else {
      for (const school of schools) {
        console.log(`  ✅ [${school.shortCode}] ${school.name.padEnd(25)} (${school._count.students} students, ${school._count.teachers} teachers)`)
      }
    }

    // 5. Login test recommendations
    console.log('\n5. TEST CREDENTIALS')
    console.log('-' .repeat(60))

    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN')
    const schoolAdmins = users.filter(u => u.role === 'SCHOOL_ADMIN' || u.role === 'ADMIN')
    const students = users.filter(u => u.role === 'STUDENT')

    if (superAdmins.length > 0) {
      console.log('\n  SUPER_ADMIN (Dashboard Access):')
      superAdmins.slice(0, 3).forEach(u => {
        console.log(`    • ${u.email}`)
      })
    } else {
      console.log('\n  ⚠️  NO SUPER_ADMIN USERS')
    }

    if (schoolAdmins.length > 0) {
      console.log('\n  SCHOOL_ADMIN/ADMIN (Dashboard Access):')
      schoolAdmins.slice(0, 3).forEach(u => {
        console.log(`    • ${u.email}`)
      })
    } else {
      console.log('\n  ⚠️  NO ADMIN USERS')
    }

    if (students.length > 0) {
      console.log('\n  STUDENT (Student Exam Access):')
      students.slice(0, 3).forEach(u => {
        console.log(`    • Student ID: ${u.student?.studentNo || 'MISSING'} (${u.email})`)
      })
    } else {
      console.log('\n  ⚠️  NO STUDENT USERS')
    }

    // 6. Issues found
    console.log('\n6. ISSUES DETECTED')
    console.log('-' .repeat(60))

    let issuesFound = false

    if (users.some(u => !u.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true')) {
      console.log('  ⚠️  Some users not email verified, but REQUIRE_EMAIL_VERIFICATION=true')
      console.log('     → These users cannot login')
      issuesFound = true
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.log('  ⚠️  JWT_SECRET < 32 characters')
      console.log('     → App startup will fail')
      issuesFound = true
    }

    if (!issuesFound) {
      console.log('  ✅ No major issues detected')
    }

    // 7. Quick start guide
    console.log('\n7. QUICK START')
    console.log('-' .repeat(60))
    console.log('  1. Set environment: NODE_ENV=development')
    console.log('  2. Start dev server: npm run dev')
    console.log('  3. Visit: http://localhost:3000/login')
    console.log('  4. Use any credentials listed above in "TEST CREDENTIALS"')
    console.log('  5. Dashboard mode: admin/super-admin only')
    console.log('  6. Student exam mode: student only\n')

  } catch (err) {
    console.error('❌ Error during diagnostics:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
