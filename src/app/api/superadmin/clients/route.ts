export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const url    = new URL(req.url);
  const search = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const sort   = url.searchParams.get("sort") ?? "createdAt";
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit  = 50;

  const where: any = { role: "CLIENT" };
  if (status)          where.status = status;
  if (search) {
    where.OR = [
      { name:  { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        creditPurchase: {
          where:  { status: "approved" },
          select: { amount: true, credits: true },
        },
        transaction: {
          where:  { type: "debit" },
          select: { amount: true },
        },
      },
      orderBy: sort === "credits"
        ? { credits: "desc" }
        : sort === "lastLogin"
        ? { lastLoginAt: "desc" }
        : { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.user.count({ where }),
  ]);

  const clients = users.map((u) => ({
    id:            u.id,
    name:          u.name,
    email:         u.email,
    credits:       u.credits,
    status:        u.status,
    createdAt:     u.createdAt,
    lastLoginAt:   u.lastLoginAt,
    totalSpent:    u.creditPurchase.reduce((s, p) => s + p.amount, 0),
    creditsBought: u.creditPurchase.reduce((s, p) => s + p.credits, 0),
    creditsUsed:   u.transaction.reduce((s, t) => s + t.amount, 0),
  }));

  return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit) });
}
