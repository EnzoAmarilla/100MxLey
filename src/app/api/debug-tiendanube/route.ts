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

  // Status distribution across all DB orders
  const allDbOrders = await prisma.order.findMany({
    where: { storeId: store.id },
    select: { status: true },
  });
  const dbStatusDist: Record<string, number> = {};
  for (const o of allDbOrders) {
    dbStatusDist[o.status] = (dbStatusDist[o.status] ?? 0) + 1;
  }

  // Raw TN payload fields for 3 recent orders (to verify field names)
  const rawSample = await prisma.order.findMany({
    where: { storeId: store.id },
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { externalId: true, rawPayload: true },
  });
  const rawStatusFields = rawSample.map((o) => {
    const raw = o.rawPayload as any;
    return {
      externalId:             o.externalId,
      status:                 raw?.status,
      payment_status:         raw?.payment_status,
      shipping_status:        raw?.shipping_status,
      fulfillment_status:     raw?.fulfillment_status,
      shipping_tracking_number: raw?.shipping_tracking_number,
    };
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
      statusDistribution: dbStatusDist,
      recentOrders: dbOrdersSample,
      rawStatusFields,
    },
    tiendanubeApi: {
      status: apiStatus,
      error: apiError,
      firstOrders: apiBody,
    },
  });
}
