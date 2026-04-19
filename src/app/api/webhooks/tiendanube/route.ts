export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { store_id, event, id: orderId } = body;

    if (event !== "orders/paid") {
      return NextResponse.json({ ok: true });
    }

    const store = await prisma.store.findFirst({
      where: { platform: "tiendanube", storeId: String(store_id) },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    // Fetch order details from Tiendanube
    const orderRes = await fetch(
      `https://api.tiendanube.com/v1/${store_id}/orders/${orderId}`,
      {
        headers: {
          Authentication: `bearer ${store.accessToken}`,
          "User-Agent": "100Mxley (support@100mxley.com)",
        },
      }
    );

    const orderData = await orderRes.json();

    const products = (orderData.products || []).map((p: any) => ({
      name: p.name,
      sku: p.sku || "N/A",
      quantity: p.quantity,
      price: p.price,
    }));

    await prisma.order.upsert({
      where: {
        storeId_externalId: {
          storeId: store.id,
          externalId: String(orderData.id),
        },
      },
      update: {
        status: orderData.status || "paid",
        totalAmount: parseFloat(orderData.total) || 0,
        products,
      },
      create: {
        storeId: store.id,
        userId: store.userId,
        externalId: String(orderData.id),
        buyerName: orderData.customer?.name || "Sin nombre",
        buyerEmail: orderData.customer?.email || "",
        address: {
          street: orderData.shipping_address?.address || "",
          city: orderData.shipping_address?.city || "",
          province: orderData.shipping_address?.province || "",
          zipcode: orderData.shipping_address?.zipcode || "",
          country: orderData.shipping_address?.country || "AR",
        },
        products,
        courier: orderData.shipping_option?.name || null,
        status: orderData.status || "paid",
        totalAmount: parseFloat(orderData.total) || 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
