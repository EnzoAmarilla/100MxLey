export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow up to 5 min for full initial sync

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTiendanubeOrders } from "@/lib/tiendanube-sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const store = await prisma.store.findFirst({
      where: {
        userId: session.user.id,
        platform: "tiendanube",
      },
      select: {
        id: true,
        storeId: true,
        accessToken: true,
        lastSync: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no conectada" }, { status: 404 });
    }

    const count = await syncTiendanubeOrders(store, session.user.id);
    const incremental = store.lastSync !== null;
    return NextResponse.json({ success: true, count, incremental });
  } catch (error: any) {
    console.error("[API_TIENDANUBE_SYNC]", error);
    return NextResponse.json({
      error: "Error interno de sincronización",
      detail: error?.message ?? String(error),
    }, { status: 500 });
  }
}
