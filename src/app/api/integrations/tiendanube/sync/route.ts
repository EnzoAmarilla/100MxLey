export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const store = await prisma.store.findFirst({
      where: {
        userId: session.user.id,
        platform: "tiendanube",
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no conectada" }, { status: 404 });
    }

    // Fetch orders from Tiendanube
    // We'll fetch the last 50 orders for this sync
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
      const errorData = await res.json();
      console.error("[TIENDANUBE_SYNC_FETCH_ERROR]", errorData);
      return NextResponse.json({ error: "Error al consultar Tiendanube" }, { status: 502 });
    }

    const ordersData = await res.json();
    
    let syncedCount = 0;

    for (const tnOrder of ordersData) {
      // Map Tiendanube status to our status
      // TN statuses: open, closed, cancelled
      // Payment statuses: pending, authorized, paid, abandoned, voided, refunded
      // Shipping statuses: unpaired, packing, shipped, delivered, returned
      
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

      const products = tnOrder.products.map((p: any) => ({
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
          userId: session.user.id,
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

    // Update lastSync
    await prisma.store.update({
      where: { id: store.id },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error) {
    console.error("[API_TIENDANUBE_SYNC]", error);
    return NextResponse.json({ error: "Error interno de sincronización" }, { status: 500 });
  }
}
