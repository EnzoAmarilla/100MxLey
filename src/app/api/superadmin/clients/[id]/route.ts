export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, createAuditLog } from "@/lib/superadmin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, credits: true,
      status: true, role: true, createdAt: true, lastLoginAt: true,
      creditPurchase: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, credits: true, amount: true, status: true,
                  packageName: true, mpPaymentId: true, createdAt: true, approvedAt: true },
      },
      transaction: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, type: true, amount: true, description: true, reference: true, createdAt: true },
      },
      order: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, status: true, totalAmount: true, createdAt: true, buyerName: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ client: user });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { status } = await req.json().catch(() => ({}));
  if (!status || !["active", "suspended", "inactive"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data:  { status },
    select: { id: true, status: true },
  });

  await createAuditLog({
    actorId:    admin.id,
    actorRole:  admin.role,
    action:     "USER_STATUS_CHANGE",
    entityType: "user",
    entityId:   params.id,
    oldValue:   existing.status,
    newValue:   status,
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
