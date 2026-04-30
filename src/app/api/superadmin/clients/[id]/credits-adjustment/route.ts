export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, createAuditLog } from "@/lib/superadmin";
import { randomUUID } from "crypto";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { delta, reason } = await req.json().catch(() => ({}));

  if (typeof delta !== "number" || delta === 0) {
    return NextResponse.json({ error: "El ajuste debe ser un número distinto de cero" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
    return NextResponse.json({ error: "El motivo es obligatorio (mínimo 3 caracteres)" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, credits: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const newBalance = user.credits + delta;
  if (newBalance < 0) {
    return NextResponse.json(
      { error: `El cliente solo tiene ${user.credits} créditos — no se puede restar ${Math.abs(delta)}` },
      { status: 400 }
    );
  }

  const type        = delta > 0 ? "credit" : "debit";
  const description = `Ajuste manual por SUPERADMIN: ${reason.trim()}`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.id },
      data:  { credits: { increment: delta } },
    }),
    prisma.transaction.create({
      data: {
        id:          randomUUID(),
        userId:      params.id,
        type,
        amount:      Math.abs(delta),
        description,
        reference:   `admin:${admin.id}`,
      },
    }),
  ]);

  await createAuditLog({
    actorId:    admin.id,
    actorRole:  admin.role,
    action:     delta > 0 ? "CREDITS_ADD" : "CREDITS_SUBTRACT",
    entityType: "user",
    entityId:   params.id,
    oldValue:   user.credits,
    newValue:   newBalance,
    reason:     reason.trim(),
  });

  return NextResponse.json({ ok: true, newBalance });
}
