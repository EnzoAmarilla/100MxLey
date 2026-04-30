export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, createAuditLog } from "@/lib/superadmin";
import { randomUUID } from "crypto";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const packages = await prisma.creditPackage.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { creditPurchase: { where: { status: "approved" } } } } },
  });

  return NextResponse.json({ packages });
}

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { name, credits, priceArs, pricePerCredit, isCustom, sortOrder, visibleToClients } =
    await req.json().catch(() => ({}));

  if (!name || (!isCustom && (!credits || !priceArs))) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (!isCustom && priceArs <= 0) {
    return NextResponse.json({ error: "El precio debe ser mayor a 0" }, { status: 400 });
  }

  const pkg = await prisma.creditPackage.create({
    data: {
      id:              randomUUID(),
      name,
      credits:         isCustom ? 0 : parseInt(credits),
      priceArs:        isCustom ? 0 : parseFloat(priceArs),
      pricePerCredit:  pricePerCredit ? parseFloat(pricePerCredit) : null,
      isCustom:        !!isCustom,
      visibleToClients: visibleToClients !== false,
      sortOrder:       parseInt(sortOrder ?? "99"),
    },
  });

  await createAuditLog({
    actorId:    admin.id,
    actorRole:  admin.role,
    action:     "PACKAGE_CREATE",
    entityType: "creditPackage",
    entityId:   pkg.id,
    newValue:   { name, credits, priceArs },
  });

  return NextResponse.json({ package: pkg });
}
