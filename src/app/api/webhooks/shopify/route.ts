export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    if (!shopDomain) {
      return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
    }

    const store = await prisma.store.findFirst({
      where: { platform: "shopify", storeId: shopDomain },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const products = (body.line_items || []).map((item: any) => ({
      name: item.name,
      sku: item.sku || "N/A",
      quantity: item.quantity,
      price: item.price,
    }));

    const shippingAddr = body.shipping_address || {};

    await prisma.order.upsert({
      where: {
        storeId_externalId: {
          storeId: store.id,
          externalId: String(body.id),
        },
      },
      update: {
        status: body.financial_status || "paid",
        totalAmount: parseFloat(body.total_price) || 0,
        products: JSON.stringify(products),
      },
      create: {
        id: randomUUID(),
        storeId: store.id,
        userId: store.userId,
        externalId: String(body.id),
        buyerName: `${shippingAddr.first_name || ""} ${shippingAddr.last_name || ""}`.trim() || body.customer?.first_name || "Sin nombre",
        buyerEmail: body.customer?.email || body.email || "",
        address: JSON.stringify({
          street: shippingAddr.address1 || "",
          city: shippingAddr.city || "",
          province: shippingAddr.province || "",
          zipcode: shippingAddr.zip || "",
          country: shippingAddr.country_code || "AR",
        }),
        products: JSON.stringify(products),
        courier: body.shipping_lines?.[0]?.title || null,
        status: body.financial_status || "paid",
        totalAmount: parseFloat(body.total_price) || 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
