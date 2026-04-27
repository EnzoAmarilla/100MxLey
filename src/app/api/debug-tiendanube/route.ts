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

  const store = await prisma.store.findFirst({
    where: { userId: session.user.id, platform: "tiendanube" },
  });

  if (!store) {
    return NextResponse.json({ error: "No hay tienda conectada en la base de datos" });
  }

  const dbOrderCount = await prisma.order.count({
    where: { storeId: store.id },
  });

  const dbOrdersSample = await prisma.order.findMany({
    where: { storeId: store.id },
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { externalId: true, status: true, totalAmount: true, createdAt: true },
  });

  let apiStatus: number | null = null;
  let apiBody: unknown = null;
  let apiError: string | null = null;

  try {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${store.storeId}/orders?per_page=5`,
      {
        headers: {
          Authentication: `bearer ${store.accessToken}`,
          "User-Agent": "100Mxley (support@100mxley.com)",
        },
      }
    );
    apiStatus = res.status;
    apiBody = await res.json();
  } catch (e: any) {
    apiError = e?.message ?? "Error desconocido";
  }

  return NextResponse.json({
    store: {
      id: store.id,
      storeId: store.storeId,
      storeName: store.storeName,
      lastSync: store.lastSync,
      tokenPreview: store.accessToken.slice(0, 8) + "...",
    },
    database: {
      totalOrders: dbOrderCount,
      recentOrders: dbOrdersSample,
    },
    tiendanubeApi: {
      status: apiStatus,
      error: apiError,
      firstOrders: apiBody,
    },
  });
}
