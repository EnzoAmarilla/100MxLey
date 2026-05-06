export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit    = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const status   = searchParams.get("status") ?? "";
  const clientId = searchParams.get("clientId") ?? "";
  const search   = searchParams.get("search") ?? "";
  const skip     = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clientId) where.userId = clientId;
  if (search) {
    where.OR = [
      { city:     { contains: search } },
      { address:  { contains: search } },
      { province: { contains: search } },
      { user: { name: { contains: search } } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.pickupRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.pickupRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, limit });
}
