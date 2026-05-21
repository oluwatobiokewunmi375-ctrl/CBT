import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: 'exam-resilience-001' } });
    console.log(JSON.stringify(exam, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
