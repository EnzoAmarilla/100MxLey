import { PrismaClient } from "@prisma/client"
import { AsyncLocalStorage } from "async_hooks"

// Tracks whether the current async context is already a retry attempt,
// so the $extends middleware doesn't loop if the reconnect also fails.
const retryCtx = new AsyncLocalStorage<boolean>()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const base = new PrismaClient({ log: ["error"] })

  const extended = base.$extends({
    query: {
      async $allOperations({ args, query }) {
        // Already in a retry — don't catch again, let the error propagate
        if (retryCtx.getStore()) return await query(args)

        try {
          return await query(args)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : ""
          const isStale =
            msg.includes("Server has closed the connection") ||
            msg.includes("Can't reach database server") ||
            msg.includes("Connection refused")

          if (isStale) {
            // Close the dead connection so Prisma can open a fresh one
            await base.$disconnect().catch(() => {})
            // Re-run the same operation inside a "retry" context
            return retryCtx.run(true, () => query(args))
          }
          throw e
        }
      },
    },
  })

  // Cast back to PrismaClient so all existing imports stay type-compatible
  return extended as unknown as PrismaClient
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient()

// Only cache in dev — in production each Lambda module load gets its own
// instance; caching in globalThis would persist stale connections.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
