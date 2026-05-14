export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Dismiss a logistics access request without enabling it
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.updateMany({
    where: { id: params.id, role: "CLIENT" },
    data: { logisticsAccessRequested: false, logisticsAccessRequestedAt: null },
  });

  return NextResponse.json({ success: true });
}
