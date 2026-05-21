import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  const dupSubmission = await prisma.$queryRaw`
    SELECT "studentId", "examId", COUNT(*) AS count
    FROM "ExamSubmission"
    GROUP BY "studentId", "examId"
    HAVING COUNT(*) > 1
  `;
  const dupResult = await prisma.$queryRaw`
    SELECT "studentId", "examId", COUNT(*) AS count
    FROM "Result"
    GROUP BY "studentId", "examId"
    HAVING COUNT(*) > 1
  `;
  console.log('duplicate submissions:', JSON.stringify(dupSubmission, null, 2));
  console.log('duplicate results:', JSON.stringify(dupResult, null, 2));
}

main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async ()=>{ await prisma.$disconnect(); });
