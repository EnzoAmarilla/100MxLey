export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const status   = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo   = searchParams.get("dateTo");
  const courier  = searchParams.get("courier");
  const page     = Math.max(0, Number(searchParams.get("page") ?? 0));

  const where: any = { userId: session.user.id };

  // Single query with nested relation filter — no extra round-trip
  if (platform) where.store = { platform };
  if (status)   where.status = status;
  if (courier)  where.courier = courier;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom + "T00:00:00-03:00");
    if (dateTo)   where.createdAt.lte = new Date(dateTo   + "T23:59:59-03:00");
  }

  // Count + fetch + status breakdown + total revenue in parallel
  const [total, orders, statusGroups, revenueAgg] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:   PAGE_SIZE,
      skip:   page * PAGE_SIZE,
      select: {
        id: true, externalId: true, buyerName: true, buyerEmail: true,
        address: true, products: true, courier: true, trackingCode: true,
        status: true, exported: true, notified: true,
        totalAmount: true, shippingCost: true, createdAt: true, rawPayload: true,
        store: { select: { platform: true, storeName: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], where, _count: { status: true } }),
    prisma.order.aggregate({ where, _sum: { totalAmount: true, shippingCost: true } }),
  ]);

  const statusCounts = statusGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count.status;
    return acc;
  }, {});

  const processedOrders = orders.map(({ rawPayload, ...o }) => {
    const raw = rawPayload as any;
    return {
      ...o,
      paymentLabel:       raw?.gateway_name ?? raw?.gateway ?? null,
      shippingOptionName: raw?.shipping_option?.name ?? null,
      buyerPhone:         raw?.customer?.phone ?? null,
    };
  });

  const totalRevenue  = revenueAgg._sum.totalAmount  ?? 0;
  const totalShipping = revenueAgg._sum.shippingCost  ?? 0;

  return NextResponse.json({
    orders: processedOrders, total, page, pageSize: PAGE_SIZE,
    statusCounts,
    totalRevenue,
    totalShipping,
    netRevenue: totalRevenue - totalShipping,
  });
}
