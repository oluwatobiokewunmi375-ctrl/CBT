const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const sessions = await prisma.$queryRawUnsafe("SELECT status, COUNT(*) AS cnt FROM \"Session\" WHERE \"examId\" = 'exam-resilience-001' GROUP BY status ORDER BY status");
    console.log(JSON.stringify(sessions));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
