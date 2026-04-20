import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const mariadb = require("mariadb");
import bcrypt from "bcryptjs";

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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not defined in .env");
  process.exit(1);
}

const parsed = parseDbUrl(dbUrl);
console.log("Connecting with:", parsed);
const { host, port, user, password, database } = parsed;

const pool = mariadb.createPool({
  host: host === 'localhost' ? '127.0.0.1' : host,
  port,
  user: user || 'root',
  password: password || '',
  database,
  connectionLimit: 1,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@100mxley.com";
  const pass = "admin123";
  const hashedPassword = await bcrypt.hash(pass, 10);

  const userRes = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name: "Administrador",
      password: hashedPassword,
      credits: 100,
    },
  });

  console.log("Usuario de prueba asegurado:", userRes.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
