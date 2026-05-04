export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const target = await prisma.user.findFirst({ where: { id: params.id, role: "ADMIN" } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { name, email, status, password } = await req.json();
  const data: Record<string, unknown> = {};

  if (name?.trim())   data.name   = name.trim();
  if (status)         data.status = status;

  if (email?.trim()) {
    const lower = email.toLowerCase().trim();
    if (lower !== target.email) {
      const conflict = await prisma.user.findUnique({ where: { email: lower } });
      if (conflict) return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 409 });
    }
    data.email = lower;
  }

  if (password?.trim()) {
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    data.password = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const target = await prisma.user.findFirst({ where: { id: params.id, role: "ADMIN" } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
