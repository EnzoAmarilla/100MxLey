import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ── 1. SUPERADMIN ──────────────────────────────────────────────────────────
  const adminEmail = "100mxley@gmail.com"
  const adminPassword = "Admin100Mx2024!"

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existingAdmin) {
    console.log(`   ⚠️  Superadmin ya existe (${adminEmail}), saltando...`)
  } else {
    const hashed = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        id:       randomUUID(),
        email:    adminEmail,
        name:     "100Mxley Admin",
        password: hashed,
        role:     "SUPERADMIN",
        status:   "active",
        credits:  0,
      },
    })
    console.log(`   ✅ Superadmin creado: ${adminEmail}`)
    console.log(`   🔑 Contraseña temporal: ${adminPassword}`)
    console.log(`   ⚠️  Cambiá la contraseña en tu primer login`)
  }

  // ── 2. PAQUETES DE CRÉDITOS ────────────────────────────────────────────────
  const packages = [
    { name: "Starter",     credits: 50,   priceArs: 5000,   sortOrder: 1 },
    { name: "Basic",       credits: 100,  priceArs: 9000,   sortOrder: 2 },
    { name: "Pro",         credits: 250,  priceArs: 20000,  sortOrder: 3 },
    { name: "Business",    credits: 500,  priceArs: 37500,  sortOrder: 4 },
    { name: "Enterprise",  credits: 1000, priceArs: 70000,  sortOrder: 5 },
  ]

  for (const pkg of packages) {
    const existing = await prisma.creditPackage.findFirst({
      where: { name: pkg.name },
    })
    if (existing) {
      console.log(`   ⚠️  Paquete "${pkg.name}" ya existe, saltando...`)
      continue
    }
    await prisma.creditPackage.create({
      data: {
        id:               randomUUID(),
        name:             pkg.name,
        credits:          pkg.credits,
        priceArs:         pkg.priceArs,
        pricePerCredit:   pkg.priceArs / pkg.credits,
        active:           true,
        visibleToClients: true,
        isCustom:         false,
        sortOrder:        pkg.sortOrder,
      },
    })
    console.log(`   ✅ Paquete creado: ${pkg.name} (${pkg.credits} créditos — $${pkg.priceArs.toLocaleString("es-AR")} ARS)`)
  }

  console.log("\n✅ Seed completado.")
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
