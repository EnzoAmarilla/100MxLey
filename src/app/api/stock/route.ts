export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sku, name, category, stock, minStock, costPrice, salePrice, soldMonth } = body;

  if (!sku || !name || !category) {
    return NextResponse.json({ error: "SKU, nombre y categoría son requeridos" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { userId: session.user.id, sku: sku.toUpperCase().trim() },
  });
  if (existing) return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      id:        randomUUID(),
      userId:    session.user.id,
      sku:       sku.toUpperCase().trim(),
      name:      name.trim(),
      category:  category.trim(),
      stock:     Number(stock)     || 0,
      minStock:  Number(minStock)  || 0,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      soldMonth: Number(soldMonth) || 0,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
