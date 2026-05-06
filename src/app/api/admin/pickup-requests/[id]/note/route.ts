export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { internalNote, clientNote } = body;

  if (!internalNote && !clientNote) {
    return NextResponse.json({ error: "Debe incluir al menos una nota" }, { status: 400 });
  }

  const existing = await prisma.pickupRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await prisma.pickupRequestHistory.create({
    data: {
      id: crypto.randomUUID(),
      pickupRequestId: params.id,
      oldStatus: null,
      newStatus: null,
      internalNote: internalNote || null,
      clientNote: clientNote || null,
      changedById: user.id,
    },
  });

  return NextResponse.json({ entry });
}
