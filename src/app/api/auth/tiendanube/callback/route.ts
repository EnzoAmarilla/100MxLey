export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/integrations?error=no_code", req.url));
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
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/integrations?error=token_failed", req.url));
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
        userId: session.user.id,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        storeName: storeData.name?.es || storeData.name?.en || "Tienda",
        domain: storeData.original_domain,
      },
      create: {
        id: randomUUID(),
        userId: session.user.id,
        platform: "tiendanube",
        storeId: String(tokenData.user_id),
        storeName: storeData.name?.es || storeData.name?.en || "Tienda",
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        domain: storeData.original_domain,
      },
    });

    // Transferir órdenes existentes al nuevo usuario (en caso de que la tienda ya existiera)
    const dbStore = await prisma.store.findUnique({
      where: {
        platform_storeId: {
          platform: "tiendanube",
          storeId: String(tokenData.user_id),
        },
      },
      select: { id: true },
    });

    if (dbStore) {
      await prisma.order.updateMany({
        where: { storeId: dbStore.id },
        data: { userId: session.user.id },
      });
    }

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

    // Sync is triggered client-side after the redirect to avoid Vercel Lambda timeout
    return NextResponse.redirect(new URL("/integrations?connected=tiendanube", req.url));
  } catch {
    return NextResponse.redirect(new URL("/integrations?error=unknown", req.url));
  }
}
