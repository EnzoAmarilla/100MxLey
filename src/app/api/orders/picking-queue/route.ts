export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ParsedProduct {
  name:          string;
  sku:           string;
  quantity:      number;
  variantValues: string[];
}

function parseProducts(
  productsJson: string | null,
  rawPayload: unknown,
): ParsedProduct[] {
  try {
    const parsed: any[] = JSON.parse(productsJson || "[]");
    const raw = (typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload) as any;
    return parsed.map((p: any, i: number) => {
      const rawP = raw?.products?.[i] ?? {};
      let sku: string = p.sku ?? "";
      if (!sku || /unidad|pack|%/i.test(sku)) {
        sku = String(rawP.product_id ?? p.sku ?? "");
      }
      return {
        name:          p.name ?? "",
        sku,
        quantity:      Number(p.quantity) || 1,
        variantValues: Array.isArray(p.variant_values) ? p.variant_values : [],
      };
    });
  } catch {
    return [];
  }
}

// GET — devuelve los pedidos del cliente autenticado con operationalStatus = "listo_para_picking"
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      userId:            session.user.id,
      operationalStatus: "listo_para_picking",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const items = orders.map((o) => ({
    id:           o.id,
    orderNumber:  o.orderNumber ?? o.externalId,
    buyerName:    o.buyerName,
    buyerEmail:   o.buyerEmail,
    trackingCode: o.trackingCode,
    createdAt:    o.createdAt,
    products:     parseProducts(o.products, o.rawPayload),
  }));

  return NextResponse.json({ orders: items });
}
