export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const url    = new URL(req.url);
  const search = url.searchParams.get("q") ?? "";

  const where: Record<string, unknown> = { role: "ADMIN" };
  if (search) {
    where.OR = [
      { name:  { contains: search } },
      { email: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id:         true,
      name:       true,
      email:      true,
      status:     true,
      createdAt:  true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      id:       randomUUID(),
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
      role:     "ADMIN",
      credits:  0,
      status:   "active",
    },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
