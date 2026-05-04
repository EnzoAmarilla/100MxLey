export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const tutorials = await prisma.tutorial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ tutorials });
}

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { title, description, videoUrl, sortOrder, active } = await req.json();
  if (!title?.trim() || !videoUrl?.trim())
    return NextResponse.json({ error: "Título y URL de video son requeridos" }, { status: 400 });

  const tutorial = await prisma.tutorial.create({
    data: {
      id:          randomUUID(),
      title:       title.trim(),
      description: description?.trim() ?? null,
      videoUrl:    videoUrl.trim(),
      sortOrder:   Number(sortOrder) || 0,
      active:      active !== false,
    },
  });
  return NextResponse.json({ tutorial }, { status: 201 });
}
