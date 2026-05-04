export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") ?? "";
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit    = Math.min(50, Number(searchParams.get("limit") ?? 30));
  const skip     = (page - 1) * limit;

  if (!clientId) {
    return NextResponse.json(
      { error: "Debe seleccionar un cliente para continuar." },
      { status: 400 },
    );
  }

  const [entries, total] = await Promise.all([
    prisma.orderStatusHistory.findMany({
      where: { order: { userId: clientId } },
      include: {
        order:     { select: { externalId: true } },
        changedBy: { select: { name: true } },
      },
      orderBy: { changedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.orderStatusHistory.count({
      where: { order: { userId: clientId } },
    }),
  ]);

  return NextResponse.json({
    total,
    entries: entries.map((e) => ({
      id:              e.id,
      orderId:         e.orderId,
      orderExternalId: e.order.externalId,
      oldStatus:       e.oldStatus,
      newStatus:       e.newStatus,
      internalNote:    e.internalNote,
      clientNote:      e.clientNote,
      changedAt:       e.changedAt,
      changedBy:       e.changedBy?.name ?? null,
    })),
  });
}
