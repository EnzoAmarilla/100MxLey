export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sku, name, category, stock, minStock, costPrice, salePrice, promoPrice, soldMonth } = body;

  const existing = await prisma.product.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  // If SKU changed, check uniqueness
  const newSku = sku?.toUpperCase().trim() ?? existing.sku;
  if (newSku !== existing.sku) {
    const conflict = await prisma.product.findFirst({
      where: { userId: session.user.id, sku: newSku },
    });
    if (conflict) return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      sku:       newSku,
      name:      name?.trim()        ?? existing.name,
      category:  category?.trim()    ?? existing.category,
      stock:     stock     !== undefined ? Number(stock)     : existing.stock,
      minStock:  minStock  !== undefined ? Number(minStock)  : existing.minStock,
      costPrice:  costPrice  !== undefined ? Number(costPrice)  : existing.costPrice,
      salePrice:  salePrice  !== undefined ? Number(salePrice)  : existing.salePrice,
      promoPrice: promoPrice !== undefined ? (Number(promoPrice) || null) : existing.promoPrice,
      soldMonth:  soldMonth  !== undefined ? Number(soldMonth)  : existing.soldMonth,
    },
  });

  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.product.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
