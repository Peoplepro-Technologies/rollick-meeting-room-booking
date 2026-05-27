import { PrismaClient } from '@prisma/client'

let globalForPrisma = globalThis.prisma

if (!globalForPrisma) {
  globalForPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./server/database.sqlite"
      }
    }
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.$connect()
  }
}

globalThis.prisma = globalForPrisma

export default globalForPrisma