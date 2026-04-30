export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, periodToDates } from "@/lib/superadmin";

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const url    = new URL(req.url);
  const period = url.searchParams.get("period") ?? "this-month";
  const { start, end } = periodToDates(period);

  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  const prevEnd   = new Date(start.getTime() - 1);

  const [
    totalClients,
    newClients,
    currentRevenue,
    prevRevenue,
    pendingPayments,
    creditsConsumed,
    creditsAvailable,
    totalOrders,
    currentOrders,
    recentPurchases,
    topClients,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: start, lte: end } } }),
    prisma.creditPurchase.aggregate({
      where: { status: "approved", approvedAt: { gte: start, lte: end } },
      _sum: { amount: true, credits: true },
      _count: true,
    }),
    prisma.creditPurchase.aggregate({
      where: { status: "approved", approvedAt: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
    prisma.creditPurchase.count({ where: { status: "pending" } }),
    prisma.transaction.aggregate({
      where: { type: "debit", createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.user.aggregate({ where: { role: "CLIENT" }, _sum: { credits: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
    // Revenue chart: purchases in period
    prisma.creditPurchase.findMany({
      where: { status: "approved", approvedAt: { gte: start, lte: end } },
      select: { amount: true, credits: true, approvedAt: true },
      orderBy: { approvedAt: "asc" },
    }),
    // Top 10 clients by total credit purchases
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true,
        creditPurchase: {
          where: { status: "approved" },
          select: { amount: true, credits: true },
        },
        transaction: {
          where: { type: "debit" },
          select: { amount: true },
        },
      },
      take: 100,
    }),
  ]);

  // Group revenue chart by day
  const revenueByDay: Record<string, { date: string; revenue: number; credits: number }> = {};
  for (const p of recentPurchases) {
    const day = (p.approvedAt ?? p.approvedAt ?? new Date()).toISOString().slice(0, 10);
    if (!revenueByDay[day]) revenueByDay[day] = { date: day, revenue: 0, credits: 0 };
    revenueByDay[day].revenue  += p.amount;
    revenueByDay[day].credits  += p.credits;
  }
  const revenueChart = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

  // Build top clients sorted by total spent
  const enriched = topClients.map((u) => ({
    id:           u.id,
    name:         u.name,
    email:        u.email,
    credits:      u.credits,
    totalSpent:   u.creditPurchase.reduce((s, p) => s + p.amount, 0),
    creditsBought: u.creditPurchase.reduce((s, p) => s + p.credits, 0),
    creditsUsed:  u.transaction.reduce((s, t) => s + t.amount, 0),
    createdAt:    u.createdAt,
  }));
  enriched.sort((a, b) => b.totalSpent - a.totalSpent);
  const top10 = enriched.slice(0, 10);

  const revenueNow  = currentRevenue._sum.amount  ?? 0;
  const revenuePrev = prevRevenue._sum.amount      ?? 0;
  const revenueDiff = revenuePrev > 0 ? ((revenueNow - revenuePrev) / revenuePrev) * 100 : null;

  return NextResponse.json({
    period,
    metrics: {
      totalClients,
      newClients,
      revenueThisMonth:     revenueNow,
      revenuePrevMonth:     revenuePrev,
      revenueGrowth:        revenueDiff,
      creditsSold:          currentRevenue._sum.credits ?? 0,
      approvedPayments:     currentRevenue._count,
      pendingPayments,
      creditsConsumed:      creditsConsumed._sum.amount ?? 0,
      creditsAvailableTotal: creditsAvailable._sum.credits ?? 0,
      totalOrders,
      ordersThisPeriod:     currentOrders,
      avgTicket:            currentRevenue._count > 0
        ? Math.round(revenueNow / currentRevenue._count)
        : 0,
    },
    revenueChart,
    topClients: top10,
  });
}
