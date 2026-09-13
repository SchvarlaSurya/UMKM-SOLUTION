import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: process.env.NODE_ENV === "production" ? 5 : 3,
    min: 1,
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: 10_000,
  })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
