export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      logisticsAccessRequested: true,
      logisticsAccessEnabled: false,
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      logisticsAccessRequestedAt: true,
    },
    orderBy: { logisticsAccessRequestedAt: "asc" },
  });

  return NextResponse.json({ users });
}
