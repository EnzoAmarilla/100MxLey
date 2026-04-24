export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await prisma.store.deleteMany({
      where: {
        userId: session.user.id,
        platform: "tiendanube",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_TIENDANUBE_DISCONNECT]", error);
    return NextResponse.json({ error: "Error al desconectar" }, { status: 500 });
  }
}
