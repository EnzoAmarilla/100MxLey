export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, internalNote, clientNote } = body;

  if (!status) return NextResponse.json({ error: "Status requerido" }, { status: 400 });

  const existing = await prisma.pickupRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await Promise.all([
    prisma.pickupRequest.update({
      where: { id: params.id },
      data: { status },
    }),
    prisma.pickupRequestHistory.create({
      data: {
        id: crypto.randomUUID(),
        pickupRequestId: params.id,
        oldStatus: existing.status,
        newStatus: status,
        internalNote: internalNote || null,
        clientNote: clientNote || null,
        changedById: user.id,
      },
    }),
  ]);

  return NextResponse.json({ request: updated });
}
