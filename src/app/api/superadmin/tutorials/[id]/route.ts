export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.title       !== undefined) data.title       = String(body.title).trim();
  if (body.description !== undefined) data.description = body.description?.trim() ?? null;
  if (body.videoUrl    !== undefined) data.videoUrl    = String(body.videoUrl).trim();
  if (body.sortOrder   !== undefined) data.sortOrder   = Number(body.sortOrder) || 0;
  if (body.active      !== undefined) data.active      = Boolean(body.active);

  const tutorial = await prisma.tutorial.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ tutorial });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  await prisma.tutorial.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
