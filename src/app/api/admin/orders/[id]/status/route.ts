import { NextResponse } from "next/server";
import { requireAdmin, OPERATIONAL_STATUSES } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { status, internalNote, clientNote } = body as {
    status: string;
    internalNote?: string | null;
    clientNote?: string | null;
  };

  if (!OPERATIONAL_STATUSES.includes(status as typeof OPERATIONAL_STATUSES[number])) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    select: { operationalStatus: true },
  });
  if (!existing) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: {
        operationalStatus:  status,
        lastUpdatedById:    user.id,
        ...(clientNote !== undefined ? { clientNote } : {}),
        ...(internalNote !== undefined ? { adminNote: internalNote } : {}),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        id:           randomUUID(),
        orderId:      params.id,
        oldStatus:    existing.operationalStatus,
        newStatus:    status,
        internalNote: internalNote ?? null,
        clientNote:   clientNote ?? null,
        changedById:  user.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
