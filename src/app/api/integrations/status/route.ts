export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const stores = await prisma.store.findMany({
      where: { userId: session.user.id },
      select: {
        platform: true,
        storeName: true,
        lastSync: true,
        createdAt: true,
      },
    });

    const status = {
      tiendanube: stores.find((s) => s.platform === "tiendanube") || null,
      shopify: stores.find((s) => s.platform === "shopify") || null,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("[API_INTEGRATIONS_STATUS]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
