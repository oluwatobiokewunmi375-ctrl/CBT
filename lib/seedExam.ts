import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

export default async function seedExam() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create a test school
    const school = await prisma.school.upsert({
      where: { shortCode: 'TEST_SCHOOL' },
      update: {},
      create: {
        name: 'Test High School',
        shortCode: 'TEST_SCHOOL',
        address: '123 Test Street, Test City',
        principal: 'Dr. Test Principal',
        motto: 'Excellence in Testing',
      },
    })

    console.log('✅ School created:', school.name)

    // Create requested super admin
    const superAdminEmail = 'adebayosamuel015@gmail.com'
    const superAdminPassword = await hash('Hibilero@2104', 12)
    const superAdmin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        password: superAdminPassword,
        fullName: 'Adebayo Samuel',
        role: 'SUPER_ADMIN',
      },
    })

    console.log('✅ Super admin created:', superAdmin.email)

    // Create school admin
    const adminPassword = await hash('admin123', 12)
    const schoolAdmin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: adminPassword,
        fullName: 'School Administrator',
        role: 'ADMIN',
      },
    })

    console.log('✅ School admin created:', schoolAdmin.email)

    // Create teacher
    const teacherPassword = await hash('teacher123', 12)
    const teacherUser = await prisma.user.upsert({
      where: { email: 'teacher@test.com' },
      update: {},
      create: {
        email: 'teacher@test.com',
        password: teacherPassword,
        fullName: 'John Teacher',
        role: 'TEACHER',
      },
    })

    const teacher = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        schoolId: school.id,
        employeeNo: 'TCH001',
        department: 'Mathematics',
      },
    })

    console.log('✅ Teacher created:', teacherUser.email)

    // Create classrooms
    const classroom1 = await prisma.classRoom.upsert({
      where: { id: 'class-ss1-a' },
      update: {},
      create: {
        id: 'class-ss1-a',
        name: 'SS1 - Class A',
        schoolId: school.id,
      },
    })

    const classroom2 = await prisma.classRoom.upsert({
      where: { id: 'class-ss2-a' },
      update: {},
      create: {
        id: 'class-ss2-a',
        name: 'SS2 - Class A',
        schoolId: school.id,
      },
    })

    console.log('✅ Classrooms created')

    // Create subjects
    const mathSubject = await prisma.subject.upsert({
      where: { id: 'subject-math' },
      update: {},
      create: {
        id: 'subject-math',
        name: 'Mathematics',
        code: 'MATH',
        schoolId: school.id,
        classRoomId: classroom1.id,
      },
    })

    const englishSubject = await prisma.subject.upsert({
      where: { id: 'subject-english' },
      update: {},
      create: {
        id: 'subject-english',
        name: 'English Language',
        code: 'ENG',
        schoolId: school.id,
        classRoomId: classroom1.id,
      },
    })

    console.log('✅ Subjects created')

    // Create 5 default students with names from requirements
    const studentSeeds = [
      { name: 'John Doe', studentNo: 'STU001' },
      { name: 'Mary James', studentNo: 'STU002' },
      { name: 'David Peter', studentNo: 'STU003' },
      { name: 'Grace Johnson', studentNo: 'STU004' },
      { name: 'Daniel Bright', studentNo: 'STU005' },
    ]

    const studentUsers = []
    const students = []
    const defaultPassword = await hash('stud123', 12)

    for (const studentData of studentSeeds) {
      const studentUser = await prisma.user.upsert({
        where: { email: `${studentData.studentNo.toLowerCase()}@test.local` },
        update: {},
        create: {
          email: `${studentData.studentNo.toLowerCase()}@test.local`,
          password: defaultPassword,
          fullName: studentData.name,
          role: 'STUDENT',
          schoolId: school.id,
        },
      })

      const student = await prisma.student.upsert({
        where: { studentNo: studentData.studentNo },
        update: {
          userId: studentUser.id,
          schoolId: school.id,
          classRoomId: classroom1.id,
        },
        create: {
          userId: studentUser.id,
          schoolId: school.id,
          studentNo: studentData.studentNo,
          classRoomId: classroom1.id,
        },
      })

      studentUsers.push(studentUser)
      students.push(student)
    }

    console.log('✅ Students created (STU001-STU005 with password: stud123)')

    // Create a sample exam
    const exam = await prisma.exam.upsert({
      where: { id: 'exam-math-001' },
      update: {},
      create: {
        id: 'exam-math-001',
        title: 'Mathematics Mid-Term Exam',
        description: 'Comprehensive mathematics assessment covering algebra and geometry',
        schoolId: school.id,
        createdById: teacher.id,
        subjectId: mathSubject.id,
        duration: 60, // 60 minutes
        totalMarks: 50,
        status: 'PUBLISHED',
        questions: {
          create: [
            {
              content: 'What is 2 + 2?',
              marks: 5,
              type: 'MULTIPLE_CHOICE',
              options: {
                create: [
                  { text: '3', isCorrect: false },
                  { text: '4', isCorrect: true },
                  { text: '5', isCorrect: false },
                  { text: '6', isCorrect: false },
                ],
              },
            },
            {
              content: 'Solve for x: 2x + 3 = 7',
              marks: 10,
              type: 'MULTIPLE_CHOICE',
              options: {
                create: [
                  { text: 'x = 1', isCorrect: false },
                  { text: 'x = 2', isCorrect: true },
                  { text: 'x = 3', isCorrect: false },
                  { text: 'x = 4', isCorrect: false },
                ],
              },
            },
            {
              content: 'What is the area of a circle with radius 5?',
              marks: 15,
              type: 'MULTIPLE_CHOICE',
              options: {
                create: [
                  { text: '25π', isCorrect: true },
                  { text: '10π', isCorrect: false },
                  { text: '5π', isCorrect: false },
                  { text: '100π', isCorrect: false },
                ],
              },
            },
            {
              content: 'Simplify: (x² - 4)/(x - 2)',
              marks: 20,
              type: 'MULTIPLE_CHOICE',
              options: {
                create: [
                  { text: 'x + 2', isCorrect: true },
                  { text: 'x - 2', isCorrect: false },
                  { text: 'x² - 4', isCorrect: false },
                  { text: 'Cannot be simplified', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    console.log('✅ Sample exam created with', exam.questions.length, 'questions')

    // Create sample results for some students
    for (let i = 0; i < 5; i++) {
      const student = students[i]
      const score = Math.floor(Math.random() * 41) + 10 // Random score between 10-50
      const percentage = (score / exam.totalMarks) * 100

      let grade = 'F'
      if (percentage >= 70) grade = 'A'
      else if (percentage >= 60) grade = 'B'
      else if (percentage >= 50) grade = 'C'

      // Create or update exam submission
      const submission = await prisma.examSubmission.upsert({
        where: {
          studentId_examId: {
            studentId: student.id,
            examId: exam.id,
          },
        },
        update: {
          answers: JSON.stringify({
            [exam.questions[0].id]: exam.questions[0].options.find(o => o.isCorrect)?.id,
            [exam.questions[1].id]: exam.questions[1].options.find(o => o.isCorrect)?.id,
            [exam.questions[2].id]: exam.questions[2].options.find(o => o.isCorrect)?.id,
            [exam.questions[3].id]: exam.questions[3].options.find(o => o.isCorrect)?.id,
          }),
          score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          timeSpent: Math.floor(Math.random() * 50) + 10, // Random time between 10-60 minutes
          status: 'SUBMITTED',
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          answers: JSON.stringify({
            [exam.questions[0].id]: exam.questions[0].options.find(o => o.isCorrect)?.id,
            [exam.questions[1].id]: exam.questions[1].options.find(o => o.isCorrect)?.id,
            [exam.questions[2].id]: exam.questions[2].options.find(o => o.isCorrect)?.id,
            [exam.questions[3].id]: exam.questions[3].options.find(o => o.isCorrect)?.id,
          }),
          score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          timeSpent: Math.floor(Math.random() * 50) + 10, // Random time between 10-60 minutes
          status: 'SUBMITTED',
        },
      })

      // Create or update result record
      await prisma.result.upsert({
        where: {
          studentId_examId: {
            studentId: student.id,
            examId: exam.id,
          },
        },
        update: {
          schoolId: school.id,
          score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          answers: submission.answers,
          timeSpent: submission.timeSpent,
          status: 'COMPLETED',
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          schoolId: school.id,
          score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          answers: submission.answers,
          timeSpent: submission.timeSpent,
          status: 'COMPLETED',
        },
      })
    }

    console.log('✅ Sample results created for 5 students')

    // Create resilience fixtures used by Playwright resilience tests.
    const resilienceSchool = await prisma.school.upsert({
      where: { shortCode: 'RESIL' },
      update: {
        name: 'Resilience School',
      },
      create: {
        name: 'Resilience School',
        shortCode: 'RESIL',
        address: '456 Resilience Way',
        principal: 'Resilience Lead',
        motto: 'Test to survive',
      },
    })

    const resilienceTeacherPassword = await hash('teacher123', 12)
    const resilienceTeacherUser = await prisma.user.upsert({
      where: { email: 'resilience-teacher@test.com' },
      update: {
        fullName: 'Resilience Teacher',
        password: resilienceTeacherPassword,
        role: 'TEACHER',
        schoolId: resilienceSchool.id,
      },
      create: {
        email: 'resilience-teacher@test.com',
        password: resilienceTeacherPassword,
        fullName: 'Resilience Teacher',
        role: 'TEACHER',
        schoolId: resilienceSchool.id,
      },
    })

    const resilienceTeacher = await prisma.teacher.upsert({
      where: { userId: resilienceTeacherUser.id },
      update: {
        schoolId: resilienceSchool.id,
        employeeNo: 'TCH-RESIL-01',
        department: 'Resilience Testing',
      },
      create: {
        userId: resilienceTeacherUser.id,
        schoolId: resilienceSchool.id,
        employeeNo: 'TCH-RESIL-01',
        department: 'Resilience Testing',
      },
    })

    const resilienceSubject = await prisma.subject.upsert({
      where: { id: 'subject-resilience' },
      update: {
        name: 'Resilience Studies',
        code: 'RESIL',
        schoolId: resilienceSchool.id,
      },
      create: {
        id: 'subject-resilience',
        name: 'Resilience Studies',
        code: 'RESIL',
        schoolId: resilienceSchool.id,
      },
    })

    const resilienceUserPassword = await hash('student123', 12)
    const resilienceUser = await prisma.user.upsert({
      where: { email: 'resilience-student@test.com' },
      update: {
        fullName: 'Resilience Student',
        password: resilienceUserPassword,
        role: 'STUDENT',
        schoolId: resilienceSchool.id,
      },
      create: {
        email: 'resilience-student@test.com',
        password: resilienceUserPassword,
        fullName: 'Resilience Student',
        role: 'STUDENT',
        schoolId: resilienceSchool.id,
      },
    })

    await prisma.student.upsert({
      where: { userId: resilienceUser.id },
      update: {
        schoolId: resilienceSchool.id,
        studentNo: 'STURESIL001',
      },
      create: {
        userId: resilienceUser.id,
        schoolId: resilienceSchool.id,
        studentNo: 'STURESIL001',
      },
    })

    await prisma.exam.upsert({
      where: { id: 'exam-resilience-001' },
      update: {
        title: 'Resilience Stress Test Exam',
        description: 'Exam used for Playwright resilience validation',
        schoolId: resilienceSchool.id,
        createdById: resilienceTeacher.id,
        subjectId: resilienceSubject.id,
        duration: 600,
        totalMarks: 2,
        status: 'PUBLISHED',
      },
      create: {
        id: 'exam-resilience-001',
        title: 'Resilience Stress Test Exam',
        description: 'Exam used for Playwright resilience validation',
        schoolId: resilienceSchool.id,
        createdById: resilienceTeacher.id,
        subjectId: resilienceSubject.id,
        duration: 600,
        totalMarks: 2,
        status: 'PUBLISHED',
        questions: {
          create: [
            {
              content: 'What is 1 + 1?',
              type: 'MULTIPLE_CHOICE',
              marks: 1,
              options: {
                create: [
                  { text: '1', isCorrect: false, order: 1 },
                  { text: '2', isCorrect: true, order: 2 },
                  { text: '3', isCorrect: false, order: 3 },
                  { text: '4', isCorrect: false, order: 4 },
                ],
              },
            },
            {
              content: 'What is 2 + 2?',
              type: 'MULTIPLE_CHOICE',
              marks: 1,
              options: {
                create: [
                  { text: '2', isCorrect: false, order: 1 },
                  { text: '3', isCorrect: false, order: 2 },
                  { text: '4', isCorrect: true, order: 3 },
                  { text: '5', isCorrect: false, order: 4 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    })

    console.log('✅ Resilience fixture created: STURESIL001 and exam-resilience-001')

    // Ensure STURESIL001 exists in TEST_SCHOOL with the default test password 'stud123'
    try {
      const testSchool = await prisma.school.findUnique({ where: { shortCode: 'TEST_SCHOOL' } })
      if (testSchool) {
        const studentNo = 'STURESIL001'
        const email = `${studentNo.toLowerCase()}@test.local`
        const defaultStudPassword = await hash('stud123', 12)

        const studentUser = await prisma.user.upsert({
          where: { email },
          update: {
            fullName: 'Resilience Student',
            password: defaultStudPassword,
            role: 'STUDENT',
            schoolId: testSchool.id,
          },
          create: {
            email,
            password: defaultStudPassword,
            fullName: 'Resilience Student',
            role: 'STUDENT',
            schoolId: testSchool.id,
          },
        })

        await prisma.student.upsert({
          where: { studentNo },
          update: {
            userId: studentUser.id,
            schoolId: testSchool.id,
          },
          create: {
            userId: studentUser.id,
            schoolId: testSchool.id,
            studentNo,
          },
        })
      }
    } catch (e) {
      console.warn('Failed ensuring STURESIL001 in TEST_SCHOOL:', e)
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('📋 Test Accounts:')
    console.log('Super Admin: superadmin@test.com / admin123')
    console.log('School Admin: admin@test.com / admin123')
    console.log('Teacher: teacher@test.com / teacher123')
    console.log('Students: student1@test.com to student10@test.com / student123')
    console.log('Resilience Student: resilience-student@test.com / student123 (STURESIL001)')
    console.log('')
    console.log('🏫 School: Test High School (TEST_SCHOOL)')
    console.log('🏫 Resilience School: RESIL')

    return true
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

