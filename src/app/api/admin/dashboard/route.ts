import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function periodDates(period: string) {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === "7d") {
    return { gte: new Date(now.getTime() - 6 * 86400000) };
  }
  if (period === "30d") {
    return { gte: new Date(now.getTime() - 29 * 86400000) };
  }
  return undefined; // "all"
}

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "7d";
  const dateFilter = periodDates(period);
  const where = dateFilter ? { createdAt: dateFilter } : {};

  const [
    pendiente,
    en_preparacion,
    listo_para_despachar,
    enviado,
    en_camino,
    entregado,
    cancelado,
    incidencia,
    activeClients,
    recentActivity,
  ] = await Promise.all([
    prisma.order.count({ where: { ...where, operationalStatus: "pendiente" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "en_preparacion" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "listo_para_despachar" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "enviado" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "en_camino" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "entregado" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "cancelado" } }),
    prisma.order.count({ where: { ...where, operationalStatus: "incidencia" } }),
    prisma.order.groupBy({ by: ["userId"], where, _count: true }).then((r) => r.length),
    prisma.orderStatusHistory.findMany({
      orderBy: { changedAt: "desc" },
      take: 10,
      include: {
        changedBy: { select: { name: true } },
        order:     { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    pendiente,
    en_preparacion,
    listo_para_despachar,
    enviado,
    en_camino,
    entregado,
    cancelado,
    incidencia,
    activeClients,
    recentActivity: recentActivity.map((h) => ({
      id:         h.id,
      orderId:    h.orderId,
      newStatus:  h.newStatus,
      changedAt:  h.changedAt,
      changedBy:  h.changedBy?.name ?? null,
      clientName: h.order?.user?.name ?? "—",
    })),
  });
}
