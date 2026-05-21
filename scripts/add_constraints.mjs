import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function existsConstraint(table, constraint) {
  const result = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND constraint_name = ${constraint}
      AND constraint_type = 'UNIQUE'
    LIMIT 1
  `;
  return result.length > 0;
}

async function main(){
  const examSubmissionConstraint = 'ExamSubmission_studentId_examId_key';
  const resultConstraint = 'Result_studentId_examId_key';

  if (!(await existsConstraint('ExamSubmission', examSubmissionConstraint))) {
    console.log('Adding unique constraint', examSubmissionConstraint);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ExamSubmission" ADD CONSTRAINT "${examSubmissionConstraint}" UNIQUE ("studentId", "examId")`
    );
  } else {
    console.log(examSubmissionConstraint, 'already exists');
  }

  if (!(await existsConstraint('Result', resultConstraint))) {
    console.log('Adding unique constraint', resultConstraint);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Result" ADD CONSTRAINT "${resultConstraint}" UNIQUE ("studentId", "examId")`
    );
  } else {
    console.log(resultConstraint, 'already exists');
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async ()=>{ await prisma.$disconnect(); });
