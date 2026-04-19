export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/tiendanube?error=no_code", req.url));
  }

  try {
    const tokenRes = await fetch("https://www.tiendanube.com/apps/authorize/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/tiendanube?error=token_failed", req.url));
    }

    // Get store info
    const storeRes = await fetch(
      `https://api.tiendanube.com/v1/${tokenData.user_id}/store`,
      {
        headers: {
          Authentication: `bearer ${tokenData.access_token}`,
          "User-Agent": "100Mxley (support@100mxley.com)",
        },
      }
    );

    const storeData = await storeRes.json();

    await prisma.store.upsert({
      where: {
        platform_storeId: {
          platform: "tiendanube",
          storeId: String(tokenData.user_id),
        },
      },
      update: {
        accessToken: tokenData.access_token,
        storeName: storeData.name?.es || storeData.name?.en || "Tienda",
        domain: storeData.original_domain,
      },
      create: {
        userId: session.user.id,
        platform: "tiendanube",
        storeId: String(tokenData.user_id),
        storeName: storeData.name?.es || storeData.name?.en || "Tienda",
        accessToken: tokenData.access_token,
        domain: storeData.original_domain,
      },
    });

    // Register webhook for orders/paid
    await fetch(
      `https://api.tiendanube.com/v1/${tokenData.user_id}/webhooks`,
      {
        method: "POST",
        headers: {
          Authentication: `bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
          "User-Agent": "100Mxley (support@100mxley.com)",
        },
        body: JSON.stringify({
          url: `${process.env.NEXTAUTH_URL}/api/webhooks/tiendanube`,
          event: "orders/paid",
        }),
      }
    );

    return NextResponse.redirect(new URL("/tiendanube?connected=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/tiendanube?error=unknown", req.url));
  }
}
