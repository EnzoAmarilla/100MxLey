export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const packages = await prisma.creditPackage.findMany({
    where:   { active: true, visibleToClients: true },
    orderBy: { sortOrder: "asc" },
    select:  { id: true, name: true, credits: true, priceArs: true, pricePerCredit: true, isCustom: true },
  });

  return NextResponse.json({ packages });
}
