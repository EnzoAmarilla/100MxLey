export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const storeWhere: any = { userId: session.user.id };
  if (platform) storeWhere.platform = platform;

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: { id: true, platform: true },
  });

  const storeIds = stores.map((s) => s.id);

  const orderWhere: any = { storeId: { in: storeIds } };
  if (dateFrom || dateTo) {
    orderWhere.createdAt = {};
    if (dateFrom) orderWhere.createdAt.gte = new Date(dateFrom);
    if (dateTo) orderWhere.createdAt.lte = new Date(dateTo);
  } else {
    orderWhere.createdAt = { gte: thirtyDaysAgo };
  }

  const orders = await prisma.order.findMany({
    where: orderWhere,
    include: { store: { select: { platform: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Group by day for chart
  const salesByDay: Record<string, number> = {};
  orders.forEach((o) => {
    const day = o.createdAt.toISOString().split("T")[0];
    salesByDay[day] = (salesByDay[day] || 0) + o.totalAmount;
  });

  const chartData = Object.entries(salesByDay).map(([date, total]) => ({
    date,
    total,
  }));

  // Products ranking
  const productCounts: Record<string, number> = {};
  const parseProducts = (products: any) => {
    if (typeof products === "string") {
      try {
        const parsed = JSON.parse(products);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(products) ? products : [];
  };

  orders.forEach((o) => {
    const products = parseProducts(o.products);
    products.forEach((p: any) => {
      const key = p.sku || p.name;
      productCounts[key] = (productCounts[key] || 0) + (p.quantity || 1);
    });
  });

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, quantity]) => ({ sku, quantity }));

  // Status counts: all orders (no date filter) — represents current pipeline state
  const allOrdersForStatus = await prisma.order.findMany({
    where: { storeId: { in: storeIds } },
    select: { status: true, totalAmount: true, store: { select: { platform: true } } },
  });

  const statusCounts: Record<string, number> = {};
  allOrdersForStatus.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  // Platform breakdown
  const platformCounts: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach((o) => {
    const p = o.store.platform;
    if (!platformCounts[p]) platformCounts[p] = { orders: 0, revenue: 0 };
    platformCounts[p].orders++;
    platformCounts[p].revenue += o.totalAmount;
  });

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    chartData,
    topProducts,
    statusCounts,
    platformCounts,
  });
}
