import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, externalId: true, storeId: true },
    where: { externalId: '1990637099' },
    orderBy: { storeId: 'asc' }, // so the one with storeId comes first (or null comes first, let's see)
    distinct: ['externalId']
  })
  console.log("Distinct orders:")
  console.log(orders)
}
main()
