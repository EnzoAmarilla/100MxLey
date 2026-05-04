export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function PATCH(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const { name, email, currentPassword, newPassword } = body;
  const data: Record<string, unknown> = {};

  if (name?.trim()) data.name = name.trim();

  if (email?.trim()) {
    const lower = email.toLowerCase().trim();
    if (lower !== admin.email) {
      const conflict = await prisma.user.findUnique({ where: { email: lower } });
      if (conflict) return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 409 });
    }
    data.email = lower;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Ingresá tu contraseña actual" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: admin.id } });
    const valid = user ? await bcrypt.compare(currentPassword, user.password) : false;
    if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    data.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: admin.id },
    data,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
