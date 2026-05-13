import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] })

// Only cache in dev — in production (Vercel serverless) each Lambda invocation
// gets a fresh client so stale MySQL connections are never reused.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
