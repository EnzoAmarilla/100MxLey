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

  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize`;

  return NextResponse.json({ url: authUrl });
}
