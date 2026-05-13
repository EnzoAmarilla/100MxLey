import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const base = new PrismaClient({ log: ["error"] })

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : ""
          // "Server has closed the connection" = stale idle connection.
          // After $disconnect the pool is cleared; the retry opens a fresh one.
          // A failed reconnect produces a different error (ECONNREFUSED, etc.)
          // so this block never triggers twice for the same call.
          if (
            msg.includes("Server has closed the connection") ||
            msg.includes("Can't reach database server") ||
            msg.includes("Connection refused")
          ) {
            await base.$disconnect().catch(() => {})
            return await query(args)
          }
          throw e
        }
      },
    },
  }) as unknown as PrismaClient
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient()

// Only cache in dev — in production each Lambda module load gets its own
// instance; caching in globalThis would persist stale connections.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
