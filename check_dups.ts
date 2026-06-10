import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, externalId: true, storeId: true, userId: true },
    where: { externalId: '1990637099' }
  })
  console.log(orders)
}
main()
