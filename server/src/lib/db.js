import { PrismaClient } from '@prisma/client'

let globalForPrisma = globalThis.prisma

if (!globalForPrisma) {
  globalForPrisma = new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.$connect()
  }
}

globalThis.prisma = globalForPrisma

export default globalForPrisma