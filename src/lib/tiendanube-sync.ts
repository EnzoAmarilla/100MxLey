import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type Store = {
  id: string;
  storeId: string;
  accessToken: string;
};

export async function syncTiendanubeOrders(store: Store, userId: string): Promise<number> {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${store.storeId}/orders?per_page=50`,
    {
      headers: {
        Authentication: `bearer ${store.accessToken}`,
        "User-Agent": "100Mxley (support@100mxley.com)",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.error("[TIENDANUBE_SYNC_ERROR]", err);
    throw new Error("Error al consultar Tiendanube");
  }

  const ordersData = await res.json();
  let syncedCount = 0;

  for (const tnOrder of ordersData) {
    let status = "pending";
    if (tnOrder.status === "cancelled") status = "cancelled";
    else if (tnOrder.payment_status === "paid") status = "paid";
    if (tnOrder.shipping_status === "shipped") status = "shipped";
    if (tnOrder.shipping_status === "delivered") status = "delivered";

    const address = {
      street: tnOrder.shipping_address?.address,
      number: tnOrder.shipping_address?.number,
      floor: tnOrder.shipping_address?.floor,
      locality: tnOrder.shipping_address?.locality,
      city: tnOrder.shipping_address?.city,
      province: tnOrder.shipping_address?.province,
      zipcode: tnOrder.shipping_address?.zipcode,
      country: tnOrder.shipping_address?.country,
    };

    const products = (tnOrder.products ?? []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      sku: p.sku || "N/A",
      quantity: p.quantity,
      price: parseFloat(p.price),
    }));

    await prisma.order.upsert({
      where: {
        storeId_externalId: {
          storeId: store.id,
          externalId: String(tnOrder.id),
        },
      },
      update: {
        status,
        buyerName: tnOrder.customer?.name || "Sin nombre",
        buyerEmail: tnOrder.customer?.email || "",
        address: JSON.stringify(address),
        products: JSON.stringify(products),
        totalAmount: parseFloat(tnOrder.total),
        rawPayload: tnOrder,
      },
      create: {
        id: randomUUID(),
        storeId: store.id,
        userId,
        externalId: String(tnOrder.id),
        buyerName: tnOrder.customer?.name || "Sin nombre",
        buyerEmail: tnOrder.customer?.email || "",
        address: JSON.stringify(address),
        products: JSON.stringify(products),
        status,
        totalAmount: parseFloat(tnOrder.total),
        rawPayload: tnOrder,
      },
    });
    syncedCount++;
  }

  await prisma.store.update({
    where: { id: store.id },
    data: { lastSync: new Date() },
  });

  return syncedCount;
}
