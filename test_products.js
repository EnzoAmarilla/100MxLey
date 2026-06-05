const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const order = await prisma.order.findFirst({
    select: { products: true, rawPayload: true }
  });
  console.log(JSON.stringify(order.products, null, 2));
  console.log(JSON.stringify(order.rawPayload.products[0], null, 2));
}
run().catch(console.error);
