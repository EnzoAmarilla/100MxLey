const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const orders = await prisma.order.findMany({
    where: { externalId: { in: ["198823864", "1988199209", "1987958024", "1987859374"] } },
    select: { externalId: true, rawPayload: true }
  });
  
  for (const o of orders) {
    console.log(`Order: ${o.externalId}`);
    for (const p of o.rawPayload.products) {
       console.log(`  Name: ${p.name}`);
       console.log(`  SKU: ${p.sku}`);
       console.log(`  Product ID: ${p.product_id}`);
       console.log(`  Barcode: ${p.barcode}`);
    }
  }
}
run().catch(console.error);
