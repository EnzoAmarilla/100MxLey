export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
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

// GET /api/admin/orders/picking-queue?clientId=xxx
// Returns orders with operationalStatus = "listo_para_picking" for the given client
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: {
      userId:            clientId,
      operationalStatus: "listo_para_picking",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const items = orders.map((o) => ({
    id:               o.id,
    orderNumber:      o.orderNumber ?? o.externalId,
    buyerName:        o.buyerName,
    buyerEmail:       o.buyerEmail,
    trackingCode:     o.trackingCode,
    createdAt:        o.createdAt,
    products:         parseProducts(o.products, o.rawPayload),
  }));

  return NextResponse.json({ orders: items });
}

// PATCH /api/admin/orders/picking-queue
// Body: { orderId: string } — marks the order as "picking_completado"
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

  await prisma.order.update({
    where: { id: orderId },
    data:  { operationalStatus: "picking_completado" },
  });

  return NextResponse.json({ ok: true });
}
