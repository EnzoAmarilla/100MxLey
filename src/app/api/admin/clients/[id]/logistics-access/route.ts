export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { enabled, reason } = body as { enabled: boolean; reason?: string };

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "El campo 'enabled' es requerido y debe ser boolean" }, { status: 400 });
  }

  const client = await prisma.user.findFirst({
    where: { id: params.id, role: "CLIENT" },
    select: { id: true, logisticsAccessEnabled: true },
  });

  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const now = new Date();
  await prisma.user.update({
    where: { id: params.id },
    data: enabled
      ? { logisticsAccessEnabled: true,  logisticsAccessEnabledAt:  now, logisticsAccessEnabledById:  admin.id }
      : { logisticsAccessEnabled: false, logisticsAccessDisabledAt: now, logisticsAccessDisabledById: admin.id },
  });

  await prisma.clientFeatureAccessLog.create({
    data: {
      id:          crypto.randomUUID(),
      clientId:    params.id,
      featureName: "logistics",
      oldValue:    client.logisticsAccessEnabled,
      newValue:    enabled,
      changedById: admin.id,
      reason:      reason ?? null,
    },
  });

  return NextResponse.json({ success: true, enabled });
}
