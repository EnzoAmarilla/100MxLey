import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { logisticsAccessEnabled: true },
  });
  if (!clientRecord?.logisticsAccessEnabled) {
    return NextResponse.json({ error: "La sección Pedidos / Logística todavía no está habilitada para tu cuenta." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const skip  = (page - 1) * limit;

  const where = { userId: session.user.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id:               true,
        externalId:       true,
        buyerName:        true,
        status:           true,
        operationalStatus: true,
        clientNote:       true,
        totalAmount:      true,
        trackingCode:     true,
        courier:          true,
        createdAt:        true,
        // Only last history entries visible to client (exclude internalNote)
        orderStatusHistory: {
          orderBy: { changedAt: "desc" },
          select: {
            id:        true,
            oldStatus: true,
            newStatus: true,
            clientNote: true,
            changedAt: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    total,
    orders: orders.map((o) => ({
      id:               o.id,
      externalId:       o.externalId,
      buyerName:        o.buyerName,
      status:           o.status,
      operationalStatus: o.operationalStatus,
      clientNote:       o.clientNote,
      totalAmount:      o.totalAmount,
      trackingCode:     o.trackingCode,
      courier:          o.courier,
      createdAt:        o.createdAt,
      history: o.orderStatusHistory.map((h) => ({
        id:         h.id,
        oldStatus:  h.oldStatus,
        newStatus:  h.newStatus,
        clientNote: h.clientNote,
        changedAt:  h.changedAt,
      })),
    })),
  });
}
