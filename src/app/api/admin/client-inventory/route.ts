import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit    = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const search   = searchParams.get("search") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";
  const skip     = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (lowStock) where.stock = { lte: prisma.product.fields.minStock };
  if (search) {
    where.OR = [
      { sku:  { contains: search } },
      { name: { contains: search } },
      { user: { name:  { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  // Apply lowStock filter post-query since we can't compare two columns in Prisma
  const filtered = lowStock
    ? items.filter((p) => p.stock <= p.minStock)
    : items;

  return NextResponse.json({
    total: lowStock ? filtered.length : total,
    items: filtered.map((p) => ({
      id:          p.id,
      sku:         p.sku,
      name:        p.name,
      category:    p.category,
      stock:       p.stock,
      minStock:    p.minStock,
      costPrice:   p.costPrice,
      salePrice:   p.salePrice,
      soldMonth:   p.soldMonth,
      clientName:  p.user?.name  ?? "—",
      clientEmail: p.user?.email ?? "—",
    })),
  });
}
