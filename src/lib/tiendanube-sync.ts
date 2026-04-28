import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type Store = {
  id: string;
  storeId: string;
  accessToken: string;
  lastSync: Date | null;
};

function mapStatus(order: any): string {
  if (order.status === "cancelled") return "cancelled";

  // Delivery/transit checks before closed — closed orders are completed deliveries
  if (order.shipping_status === "delivered") return "delivered";
  if (order.status === "closed") return "delivered";
  if (order.shipping_status === "shipped") return "shipped";

  // Payment-based fulfillment pipeline
  const paidStatuses = ["paid", "partially_paid", "partially_refunded", "authorized"];
  if (paidStatuses.includes(order.payment_status)) {
    return order.shipping_tracking_number ? "ready_to_ship" : "paid";
  }

  return "pending";
}

export async function syncTiendanubeOrders(store: Store, userId: string): Promise<number> {
  const PER_PAGE = 200;
  let page = 1;
  const allOrders: any[] = [];

  // Incremental sync: only fetch orders updated since last sync
  // Note: colons are valid unencoded in query string values — do NOT encodeURIComponent here
  const updatedSince = store.lastSync
    ? `&updated_at_min=${store.lastSync.toISOString()}`
    : "";

  while (true) {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${store.storeId}/orders?per_page=${PER_PAGE}&page=${page}${updatedSince}`,
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
    if (!Array.isArray(ordersData) || ordersData.length === 0) break;

    allOrders.push(...ordersData);
    if (ordersData.length < PER_PAGE) break;
    page++;
  }

  const BATCH = 20;
  for (let i = 0; i < allOrders.length; i += BATCH) {
    const batch = allOrders.slice(i, i + BATCH);

    await Promise.all(
      batch.map((tnOrder) => {
        const status = mapStatus(tnOrder);

        const address = {
          street:   tnOrder.shipping_address?.address,
          number:   tnOrder.shipping_address?.number,
          floor:    tnOrder.shipping_address?.floor,
          locality: tnOrder.shipping_address?.locality,
          city:     tnOrder.shipping_address?.city,
          province: tnOrder.shipping_address?.province,
          zipcode:  tnOrder.shipping_address?.zipcode,
          country:  tnOrder.shipping_address?.country,
        };

        const products = (tnOrder.products ?? []).map((p: any) => ({
          id:       String(p.id),
          name:     p.name,
          sku:      p.sku || "N/A",
          quantity: p.quantity,
          price:    parseFloat(p.price),
        }));

        const trackingCode = tnOrder.shipping_tracking_number || null;

        const orderedAt = tnOrder.created_at ? new Date(tnOrder.created_at) : undefined;

        return prisma.order.upsert({
          where: {
            storeId_externalId: {
              storeId:    store.id,
              externalId: String(tnOrder.id),
            },
          },
          update: {
            status,
            buyerName:    tnOrder.customer?.name  || "Sin nombre",
            buyerEmail:   tnOrder.customer?.email || "",
            address:      JSON.stringify(address),
            products:     JSON.stringify(products),
            totalAmount:  parseFloat(tnOrder.total),
            trackingCode,
            rawPayload:   tnOrder,
            ...(orderedAt && { createdAt: orderedAt }),
          },
          create: {
            id:           randomUUID(),
            storeId:      store.id,
            userId,
            externalId:   String(tnOrder.id),
            buyerName:    tnOrder.customer?.name  || "Sin nombre",
            buyerEmail:   tnOrder.customer?.email || "",
            address:      JSON.stringify(address),
            products:     JSON.stringify(products),
            status,
            totalAmount:  parseFloat(tnOrder.total),
            trackingCode,
            rawPayload:   tnOrder,
            ...(orderedAt && { createdAt: orderedAt }),
          },
        });
      })
    );
  }

  await prisma.store.update({
    where: { id: store.id },
    data:  { lastSync: new Date() },
  });

  return allOrders.length;
}
