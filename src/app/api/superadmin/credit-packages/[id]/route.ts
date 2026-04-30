export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, createAuditLog } from "@/lib/superadmin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const existing = await prisma.creditPackage.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

  const data: any = {};
  if (body.name             !== undefined) data.name             = body.name;
  if (body.credits          !== undefined) data.credits          = parseInt(body.credits);
  if (body.priceArs         !== undefined) data.priceArs         = parseFloat(body.priceArs);
  if (body.pricePerCredit   !== undefined) data.pricePerCredit   = body.pricePerCredit ? parseFloat(body.pricePerCredit) : null;
  if (body.active           !== undefined) data.active           = !!body.active;
  if (body.visibleToClients !== undefined) data.visibleToClients = !!body.visibleToClients;
  if (body.sortOrder        !== undefined) data.sortOrder        = parseInt(body.sortOrder);

  if (data.priceArs !== undefined && data.priceArs < 0) {
    return NextResponse.json({ error: "El precio no puede ser negativo" }, { status: 400 });
  }

  const updated = await prisma.creditPackage.update({ where: { id: params.id }, data });

  await createAuditLog({
    actorId:    admin.id,
    actorRole:  admin.role,
    action:     "PACKAGE_UPDATE",
    entityType: "creditPackage",
    entityId:   params.id,
    oldValue:   { name: existing.name, priceArs: existing.priceArs, active: existing.active },
    newValue:   { name: updated.name,  priceArs: updated.priceArs,  active: updated.active },
  });

  return NextResponse.json({ package: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const pkg = await prisma.creditPackage.findUnique({ where: { id: params.id } });
  if (!pkg) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

  // Soft delete: deactivate instead of removing to preserve purchase history
  await prisma.creditPackage.update({
    where: { id: params.id },
    data:  { active: false, visibleToClients: false },
  });

  await createAuditLog({
    actorId:    admin.id,
    actorRole:  admin.role,
    action:     "PACKAGE_DEACTIVATE",
    entityType: "creditPackage",
    entityId:   params.id,
    oldValue:   { active: pkg.active },
    newValue:   { active: false },
  });

  return NextResponse.json({ ok: true });
}
