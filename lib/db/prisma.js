import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/cbt_dev'
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
