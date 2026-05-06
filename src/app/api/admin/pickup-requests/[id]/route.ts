export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.pickupRequest.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { createdAt: "desc" },
        include: {
          changedBy: { select: { name: true, role: true } },
        },
      },
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ request });
}
