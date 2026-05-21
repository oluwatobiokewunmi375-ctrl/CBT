import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetRequestedAt" timestamp with time zone`
  );
  console.log('Added missing User columns if they did not exist');
}

main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async ()=>{ await prisma.$disconnect(); });
