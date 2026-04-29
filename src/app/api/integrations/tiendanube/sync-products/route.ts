export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTiendanubeProducts } from "@/lib/tiendanube-products-sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const store = await prisma.store.findFirst({
      where: { userId: session.user.id, platform: "tiendanube" },
      select: { id: true, storeId: true, accessToken: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no conectada" }, { status: 404 });
    }

    const count = await syncTiendanubeProducts(store, session.user.id);
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("[API_TN_SYNC_PRODUCTS]", error);
    return NextResponse.json(
      { error: "Error al sincronizar productos", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
