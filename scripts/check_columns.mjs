import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tables = ['User', 'Session', 'ExamSubmission', 'Result'];
const modelToTable = {
  User: 'User',
  Session: 'Session',
  ExamSubmission: 'ExamSubmission',
  Result: 'Result',
};

async function main() {
  for (const model of tables) {
    const table = modelToTable[model];
    const columns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name=${table}
      ORDER BY ordinal_position
    `;
    console.log(`\nTable ${table} columns:`);
    console.log(columns.map((c) => c.column_name).join(', '));
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async ()=>{ await prisma.$disconnect(); });
