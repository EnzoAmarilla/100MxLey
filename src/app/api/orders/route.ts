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
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const courier = searchParams.get("courier");

  const where: any = { userId: session.user.id };

  if (platform) {
    const stores = await prisma.store.findMany({
      where: { userId: session.user.id, platform },
      select: { id: true },
    });
    where.storeId = { in: stores.map((s) => s.id) };
  }

  if (status) where.status = status;
  if (courier) where.courier = courier;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { store: { select: { platform: true, storeName: true } } },
  });

  return NextResponse.json({ orders });
}
