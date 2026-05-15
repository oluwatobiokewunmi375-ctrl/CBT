import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Seeding test data...\n')

    // 1. Create or get Demo School
    let demoSchool = await prisma.school.findUnique({
      where: { shortCode: 'DEMO' }
    })

    if (!demoSchool) {
      demoSchool = await prisma.school.create({
        data: {
          name: 'Demo Secondary School',
          shortCode: 'DEMO',
          address: '123 Education Avenue, Lagos, Nigeria',
          principal: 'Mr. Johnson Okafor',
          logoUrl: 'https://via.placeholder.com/150/0066cc/ffffff?text=DEMO',
          bannerUrl: 'https://via.placeholder.com/1200x300/0066cc/ffffff?text=Demo+School',
          motto: 'Excellence in Education',
          theme: JSON.stringify({ primaryColor: "#0066cc", secondaryColor: "#00cc66", accentColor: "#ff6600" })
        }
      })
      console.log('✅ Created demo school:', demoSchool.name)
    } else {
      console.log('✅ Demo school already exists:', demoSchool.name)
    }

    // 2. Create admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin.demo@test.com' }
    })

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10)
      adminUser = await prisma.user.create({
        data: {
          email: 'admin.demo@test.com',
          fullName: 'Demo Admin',
          password: hashedPassword,
          role: 'SCHOOL_ADMIN',
          schoolId: demoSchool.id
        }
      })
      console.log('✅ Created admin user:', adminUser.email)
    } else {
      console.log('✅ Admin user already exists:', adminUser.email)
    }

    // 3. Create test student user
    let studentUser = await prisma.user.findUnique({
      where: { email: 'student.demo@test.com' }
    })

    if (!studentUser) {
      const hashedPassword = await bcrypt.hash('Student@123', 10)
      studentUser = await prisma.user.create({
        data: {
          email: 'student.demo@test.com',
          fullName: 'Test Student',
          password: hashedPassword,
          role: 'STUDENT',
          schoolId: demoSchool.id,
          student: {
            create: {
              studentNo: `STU-${demoSchool.shortCode}-0001`,
              schoolId: demoSchool.id,
              parentName: 'Mrs. Mary Johnson',
              parentPhone: '+234 805 123 4567',
              parentEmail: 'mary.johnson@email.com',
              address: 'Lagos, Nigeria',
              dob: new Date('2008-01-15'),
              gender: 'Male'
            }
          }
        }
      })
      console.log('✅ Created student user:', studentUser.email)
      console.log('   Student ID:', `STU-${demoSchool.shortCode}-0001`)
    } else {
      console.log('✅ Student user already exists:', studentUser.email)
    }

    // 4. Create classroom
    let classroom = await prisma.classroom.findFirst({
      where: { schoolId: demoSchool.id }
    })

    if (!classroom) {
      classroom = await prisma.classroom.create({
        data: {
          name: 'SS2A',
          schoolId: demoSchool.id
        }
      })
      console.log('✅ Created classroom:', classroom.name)
    }

    // 5. Create test teacher
    let teacherUser = await prisma.user.findUnique({
      where: { email: 'teacher.demo@test.com' }
    })

    if (!teacherUser) {
      const hashedPassword = await bcrypt.hash('Teacher@123', 10)
      teacherUser = await prisma.user.create({
        data: {
          email: 'teacher.demo@test.com',
          fullName: 'Mr. James Teacher',
          password: hashedPassword,
          role: 'TEACHER',
          schoolId: demoSchool.id,
          teacher: {
            create: {
              employeeNo: `TEACH-${demoSchool.shortCode}-001`,
              schoolId: demoSchool.id,
              classRoomId: classroom.id,
              qualifications: 'B.Sc. Education, M.Ed'
            }
          }
        }
      })
      console.log('✅ Created teacher user:', teacherUser.email)
    } else {
      console.log('✅ Teacher user already exists:', teacherUser.email)
    }

    // 6. Create sample exam
    let exam = await prisma.exam.findFirst({
      where: { schoolId: demoSchool.id }
    })

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          title: 'Mathematics - SS2',
          description: 'Final Examination for Senior Secondary 2',
          subject: 'Mathematics',
          duration: 120,
          totalQuestions: 50,
          schoolId: demoSchool.id,
          createdBy: adminUser.id,
          questions: {
            create: [
              {
                question: 'What is 2 + 2?',
                type: 'MULTIPLE_CHOICE',
                options: JSON.stringify(['3', '4', '5', '6']),
                correctAnswer: '1',
                marks: 1
              },
              {
                question: 'Simplify: 5x + 3x',
                type: 'MULTIPLE_CHOICE',
                options: JSON.stringify(['8x', '15x', '2x', '8']),
                correctAnswer: '0',
                marks: 1
              }
            ]
          }
        }
      })
      console.log('✅ Created sample exam:', exam.title)
    }

    console.log('\n✅ Seed completed successfully!\n')
    console.log('📝 Test Credentials:')
    console.log('   Admin: admin.demo@test.com / Admin@123')
    console.log('   Student: student.demo@test.com / Student@123')
    console.log('   Student ID: STU-DEMO-0001')
    console.log('   Teacher: teacher.demo@test.com / Teacher@123\n')

  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})


