import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main(){
  const school = await prisma.school.create({ data: { name: `DBG-${Date.now()}`, shortCode: `DB${Date.now()}` } });
  const user = await prisma.user.create({ data: { email: `dbg${Date.now()}@test.local`, password: 'x', role: 'STUDENT', fullName: 'DBG' } });
  const student = await prisma.student.create({ data: { userId: user.id, schoolId: school.id } });
  const exam = await prisma.exam.create({ data: { title: `Exam-${Date.now()}`, schoolId: school.id, duration: 60, totalMarks: 10, status: 'PUBLISHED' } });

  console.log('Fixtures created:', { schoolId: school.id, studentId: student.id, examId: exam.id });

  const attempts = 10;
  const tasks = Array.from({ length: attempts }).map(async (v, i) => {
    const preStudent = await prisma.student.findUnique({ where: { id: student.id } });
    const preExam = await prisma.exam.findUnique({ where: { id: exam.id } });
    console.log(`Attempt ${i} pre-check: student=${!!preStudent} exam=${!!preExam}`);
  });

  await Promise.all(tasks);

  await prisma.exam.delete({ where: { id: exam.id } });
  await prisma.student.delete({ where: { id: student.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.school.delete({ where: { id: school.id } });
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
