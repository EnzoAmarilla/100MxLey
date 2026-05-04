export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {
    role:  "CLIENT",
    store: { some: {} },
  };

  if (search) {
    where.OR = [
      { name:  { contains: search } },
      { email: { contains: search } },
    ];
  }

  const clients = await prisma.user.findMany({
    where,
    select: {
      id:         true,
      name:       true,
      email:      true,
      status:     true,
      credits:    true,
      createdAt:  true,
      lastLoginAt: true,
      store: {
        select: {
          id:              true,
          platform:        true,
          storeId:         true,
          storeName:       true,
          domain:          true,
          lastSync:        true,
          lastProductSync: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { order: true, product: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ clients });
}
