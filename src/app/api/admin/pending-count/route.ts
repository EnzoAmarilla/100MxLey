export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const count = await prisma.user.count({
    where: {
      logisticsAccessRequested: true,
      logisticsAccessEnabled: false,
    },
  });

  return NextResponse.json({ count });
}
