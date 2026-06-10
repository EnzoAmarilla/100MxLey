import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    const res = await prisma.order.groupBy({
      by: ['status'],
      where: { store: { platform: 'tiendanube' } },
      _count: { status: true }
    })
    console.log("SUCCESS:", res)
  } catch (e: any) {
    console.error("ERROR:", e.message)
  }
}
main()
