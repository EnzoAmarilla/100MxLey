export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Source of truth for pricing — never trust frontend amounts
const CREDIT_PRICES: Record<number, number> = { 50: 5000, 100: 9000, 200: 16000 };
const CUSTOM_PRICE_PER_CREDIT = 100;
const MIN_CUSTOM_CREDITS = 10;
const MAX_CUSTOM_CREDITS = 10_000;

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const credits = Number(body.credits);

  if (!credits || !Number.isInteger(credits) || credits <= 0) {
    return NextResponse.json({ error: "Cantidad de créditos inválida" }, { status: 400 });
  }

  // Compute price server-side — ignore any amount from the client
  const knownPrice = CREDIT_PRICES[credits as keyof typeof CREDIT_PRICES];
  let price: number;
  let packageName: string;

  if (knownPrice) {
    price = knownPrice;
    packageName = `Paquete ${credits} créditos`;
  } else {
    if (credits < MIN_CUSTOM_CREDITS) {
      return NextResponse.json({ error: `Mínimo ${MIN_CUSTOM_CREDITS} créditos` }, { status: 400 });
    }
    if (credits > MAX_CUSTOM_CREDITS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_CUSTOM_CREDITS.toLocaleString("es-AR")} créditos` },
        { status: 400 }
      );
    }
    price = credits * CUSTOM_PRICE_PER_CREDIT;
    packageName = `${credits} créditos personalizados`;
  }

  const purchaseId = randomUUID();

  try {
    // Record pending purchase before hitting MP
    await prisma.creditPurchase.create({
      data: {
        id: purchaseId,
        userId: session.user.id,
        credits,
        amount: price,
        currency: "ARS",
        status: "pending",
        packageName,
      },
    });

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `credits-${credits}`,
            title: `${credits} créditos — 100Mxley`,
            quantity: 1,
            unit_price: price,
            currency_id: "ARS",
          },
        ],
        // Format: userId|credits|purchaseId — used by webhook to identify the purchase
        external_reference: `${session.user.id}|${credits}|${purchaseId}`,
        back_urls: {
          success: `${BASE_URL}/credits?payment=success`,
          failure: `${BASE_URL}/credits?payment=failure`,
          pending: `${BASE_URL}/credits?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
      },
    });

    // Store preferenceId for reference
    await prisma.creditPurchase.update({
      where: { id: purchaseId },
      data: { mpPreferenceId: result.id ?? null },
    });

    console.log(
      `[MP_PREFERENCE_CREATED] userId=${session.user.id} credits=${credits} price=${price} purchaseId=${purchaseId}`
    );

    return NextResponse.json({ url: result.init_point });
  } catch (err: any) {
    console.error("[MP_CREATE_PREFERENCE_ERROR]", err?.message ?? err);
    // Mark purchase as cancelled if MP call failed
    await prisma.creditPurchase.update({
      where: { id: purchaseId },
      data: { status: "cancelled" },
    }).catch(() => {});
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 });
  }
}
