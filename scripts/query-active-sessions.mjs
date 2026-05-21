import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  try {
    const studentNos = Array.from({ length: 25 }, (_, i) => `LOADSTU${String(i + 1).padStart(4, '0')}`);
    const users = await prisma.user.findMany({ where: { email: { in: studentNos.map(no => `loadtest+${no.toLowerCase()}@example.com`) } }, select: { id: true, email: true } });
    const students = await prisma.student.findMany({ where: { userId: { in: users.map(u => u.id) } }, select: { id: true, studentNo: true, userId: true } });
    const sessions = await prisma.session.findMany({ where: { studentId: { in: students.map(s => s.id) }, examId: 'exam-resilience-001' }, orderBy: { createdAt: 'desc' }, take: 50 });
    console.log(JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
