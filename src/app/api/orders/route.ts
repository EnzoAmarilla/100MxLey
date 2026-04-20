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
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo + "T23:59:59");
  }

  // Count + fetch in parallel
  const [total, orders] = await Promise.all([
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
        totalAmount: true, createdAt: true,
        store: { select: { platform: true, storeName: true } },
      },
    }),
  ]);

  return NextResponse.json({ orders, total, page, pageSize: PAGE_SIZE });
}
