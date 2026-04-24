export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clientId = process.env.TIENDANUBE_CLIENT_ID;
  const redirectUri = process.env.TIENDANUBE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Tiendanube no está configurado" },
      { status: 500 }
    );
  }

  const scope = "read_orders write_orders read_customers read_products";
  const authUrl = `https://www.tiendanube.com/apps/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

  return NextResponse.json({ url: authUrl });
}
