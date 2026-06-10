import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, externalId: true, storeId: true, userId: true },
    where: { externalId: '1990637099', store: { platform: 'tiendanube' } }
  })
  console.log("With store.platform filter:")
  console.log(orders)

  const orders2 = await prisma.order.findMany({
    select: { id: true, externalId: true, storeId: true, userId: true },
    where: { externalId: '1990637099' }
  })
  console.log("Without store.platform filter:")
  console.log(orders2)
}
main()
