import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = "Staff100Mx2024!"

const staffUsers = [
  { email: "staff_1@100mxley.com", name: "Staff 1" },
  { email: "staff_2@100mxley.com", name: "Staff 2" },
  { email: "staff_3@100mxley.com", name: "Staff 3" },
  { email: "staff_4@100mxley.com", name: "Staff 4" },
]

async function main() {
  console.log("🌱 Creando usuarios staff...")

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  for (const u of staffUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`   ⚠️  Ya existe: ${u.email}, saltando...`)
      continue
    }
    await prisma.user.create({
      data: {
        id:       randomUUID(),
        email:    u.email,
        name:     u.name,
        password: hashed,
        role:     "ADMIN",
        status:   "active",
        credits:  0,
      },
    })
    console.log(`   ✅ Creado: ${u.email}`)
  }

  console.log(`\n🔑 Contraseña por defecto: ${DEFAULT_PASSWORD}`)
  console.log("✅ Listo.")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
