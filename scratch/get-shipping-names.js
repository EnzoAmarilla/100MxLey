const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: {
      rawPayload: true,
    }
  });

  const names = new Set();
  const rawNames = new Set();
  for (const o of orders) {
    if (o.shippingOptionName) {
      names.add(o.shippingOptionName);
    }
    try {
      const raw = typeof o.rawPayload === 'string' ? JSON.parse(o.rawPayload) : o.rawPayload;
      if (raw && raw.shipping_option) {
        if (typeof raw.shipping_option === 'string') {
          rawNames.add(raw.shipping_option);
        } else if (raw.shipping_option.name) {
          rawNames.add(raw.shipping_option.name);
        }
      }
    } catch (e) {}
  }
  
  console.log("--- shippingOptionName ---");
  console.log(Array.from(names));
  console.log("--- rawPayload shipping_option ---");
  console.log(Array.from(rawNames));
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
