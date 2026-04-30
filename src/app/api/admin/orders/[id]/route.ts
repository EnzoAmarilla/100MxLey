import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user:              { select: { name: true, email: true } },
      lastUpdatedByUser: { select: { name: true } },
      orderStatusHistory: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id:               order.id,
    externalId:       order.externalId,
    buyerName:        order.buyerName,
    buyerEmail:       order.buyerEmail,
    address:          order.address,
    products:         order.products,
    totalAmount:      order.totalAmount,
    shippingCost:     order.shippingCost,
    status:           order.status,
    operationalStatus: order.operationalStatus,
    trackingCode:     order.trackingCode,
    courier:          order.courier,
    adminNote:        order.adminNote,
    clientNote:       order.clientNote,
    createdAt:        order.createdAt,
    clientName:       order.user?.name  ?? "—",
    clientEmail:      order.user?.email ?? "—",
    lastUpdatedBy:    order.lastUpdatedByUser?.name ?? null,
    history: order.orderStatusHistory.map((h) => ({
      id:           h.id,
      oldStatus:    h.oldStatus,
      newStatus:    h.newStatus,
      internalNote: h.internalNote,
      clientNote:   h.clientNote,
      changedAt:    h.changedAt,
      changedBy:    h.changedBy?.name ?? null,
    })),
  });
}
