import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const student = await prisma.student.findFirst({ include: { user: true, school: true } })
const exam = await prisma.exam.findFirst({ include: { questions: true } })
console.log('studentNo=', student?.studentNo, 'email=', student?.user?.email, 'school=', student?.school?.name)
console.log('examId=', exam?.id, 'examTitle=', exam?.title, 'questions=', exam?.questions?.length)
await prisma.$disconnect()
