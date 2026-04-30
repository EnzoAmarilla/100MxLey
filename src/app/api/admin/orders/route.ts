import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const skip   = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.operationalStatus = status;
  if (search) {
    where.OR = [
      { buyerName:  { contains: search } },
      { buyerEmail: { contains: search } },
      { externalId: { contains: search } },
      { user: { name:  { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user:             { select: { name: true, email: true } },
        lastUpdatedByUser: { select: { name: true } },
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
      buyerEmail:       o.buyerEmail,
      status:           o.status,
      operationalStatus: o.operationalStatus,
      totalAmount:      o.totalAmount,
      createdAt:        o.createdAt,
      clientName:       o.user?.name  ?? "—",
      clientEmail:      o.user?.email ?? "—",
      lastUpdatedBy:    o.lastUpdatedByUser?.name ?? null,
      trackingCode:     o.trackingCode,
    })),
  });
}
