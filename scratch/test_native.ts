import { PrismaClient } from '@prisma/client';

async function main() {
  console.log("Starting native Prisma test...");
  console.log("DB_URL:", process.env.DATABASE_URL?.split('@')[1]);

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst();
    console.log("SUCCESS! Found user:", user ? user.email : "No users in DB");
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
