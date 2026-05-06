export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function periodDates(period: string): { gte: Date } | undefined {
  const now = new Date();
  if (period === "today") { const s = new Date(now); s.setHours(0, 0, 0, 0); return { gte: s }; }
  if (period === "7d")  return { gte: new Date(now.getTime() - 6 * 86400000) };
  if (period === "30d") return { gte: new Date(now.getTime() - 29 * 86400000) };
  return undefined;
}

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period   = searchParams.get("period") ?? "7d";
  const clientId = searchParams.get("clientId") ?? "";
  const dateFilter = periodDates(period);

  // ── Global overview (no client selected) ──────────────────────────────────
  if (!clientId) {
    const [connectedClients, pendingTotal, incidenceTotal, logisticsActive, logisticsBlocked, logisticsRequests] = await Promise.all([
      prisma.user.count({ where: { role: "CLIENT", store: { some: {} } } }),
      prisma.order.count({ where: { operationalStatus: "pendiente" } }),
      prisma.order.count({ where: { operationalStatus: "incidencia" } }),
      prisma.user.count({ where: { role: "CLIENT", logisticsAccessEnabled: true } }),
      prisma.user.count({ where: { role: "CLIENT", logisticsAccessEnabled: false } }),
      prisma.user.count({ where: { role: "CLIENT", logisticsAccessRequested: true, logisticsAccessEnabled: false } }),
    ]);
    return NextResponse.json({ mode: "global", connectedClients, pendingTotal, incidenceTotal, logisticsActive, logisticsBlocked, logisticsRequests });
  }

  // ── Client-specific metrics ────────────────────────────────────────────────
  const base: Record<string, unknown> = { userId: clientId };
  if (dateFilter) base.createdAt = dateFilter;

  const [
    pendiente, en_preparacion, listo_para_despachar,
    enviado, en_camino, entregado, cancelado, incidencia,
    recentActivity,
  ] = await Promise.all([
    prisma.order.count({ where: { ...base, operationalStatus: "pendiente" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "en_preparacion" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "listo_para_despachar" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "enviado" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "en_camino" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "entregado" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "cancelado" } }),
    prisma.order.count({ where: { ...base, operationalStatus: "incidencia" } }),
    prisma.orderStatusHistory.findMany({
      where:   { order: { userId: clientId } },
      orderBy: { changedAt: "desc" },
      take:    10,
      include: {
        changedBy: { select: { name: true } },
        order:     { select: { externalId: true } },
      },
    }),
  ]);

  return NextResponse.json({
    mode: "client",
    pendiente, en_preparacion, listo_para_despachar,
    enviado, en_camino, entregado, cancelado, incidencia,
    recentActivity: recentActivity.map((h) => ({
      id:              h.id,
      orderId:         h.orderId,
      orderExternalId: h.order.externalId,
      newStatus:       h.newStatus,
      changedAt:       h.changedAt,
      changedBy:       h.changedBy?.name ?? null,
    })),
  });
}
