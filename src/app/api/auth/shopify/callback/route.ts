import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state"); // userId

  if (!code || !shop || !state) {
    return NextResponse.redirect(new URL("/shopify?error=missing_params", req.url));
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/shopify?error=token_failed", req.url));
    }

    // Get shop info
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": tokenData.access_token },
    });

    const shopData = await shopRes.json();

    await prisma.store.upsert({
      where: {
        platform_storeId: {
          platform: "shopify",
          storeId: shop,
        },
      },
      update: {
        accessToken: tokenData.access_token,
        storeName: shopData.shop?.name || shop,
        domain: shop,
      },
      create: {
        userId: state,
        platform: "shopify",
        storeId: shop,
        storeName: shopData.shop?.name || shop,
        accessToken: tokenData.access_token,
        domain: shop,
      },
    });

    // Register webhook for orders/paid
    await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": tokenData.access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "orders/paid",
          address: `${process.env.NEXTAUTH_URL}/api/webhooks/shopify`,
          format: "json",
        },
      }),
    });

    return NextResponse.redirect(new URL("/shopify?connected=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/shopify?error=unknown", req.url));
  }
}
