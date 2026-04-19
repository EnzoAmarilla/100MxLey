import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

console.log("[PRISMA_INIT_SIGNAL] File loaded at", new Date().toISOString());

function parseDbUrl(dbUrl: string) {
  const withoutProtocol = dbUrl.replace(/^mysql:\/\//, "");
  const [credentials, rest] = withoutProtocol.split("@");
  if (!rest) throw new Error("Invalid DATABASE_URL format.");
  const [user, password] = credentials.split(":");
  const [hostPort, database] = rest.split("/");
  const [host, portStr] = hostPort.split(":");
  const port = portStr ? Number(portStr) : 3306;

  return { host, port, user, password: password || "", database };
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("[PRISMA] No DATABASE_URL, using default construction.");
    return new PrismaClient();
  }

  try {
    const { host, port, user, password, database } = parseDbUrl(dbUrl);
    
    // Using require to bypass ESM default export issues in Next.js
    const mariadb = require("mariadb");
    
    console.log(`[PRISMA] Connecting to ${host}:${port} with 20 limit...`);

    const pool = mariadb.createPool({
      host: host === 'localhost' ? '127.0.0.1' : host,
      port,
      user: user || 'root',
      password: password || '',
      database,
      connectionLimit: 20,
      acquireTimeout: 30000,
      connectTimeout: 20000,
      allowPublicKeyRetrieval: true,
      noDelay: true,
      ssl: false,
    });

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("[PRISMA] Adapter creation ERROR, falling back:", error);
    // In Prisma 7, this will likely fail if no URL found, but we attempt.
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
