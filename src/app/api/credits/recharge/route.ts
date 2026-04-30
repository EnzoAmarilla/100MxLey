export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const MIN_CUSTOM = 10;
const MAX_CUSTOM = 10_000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body    = await req.json().catch(() => ({}));
  const credits = Number(body.credits);

  if (!credits || !Number.isInteger(credits) || credits <= 0) {
    return NextResponse.json({ error: "Cantidad de créditos inválida" }, { status: 400 });
  }

  // Fetch matching active package from DB (source of truth for pricing)
  const pkg = await prisma.creditPackage.findFirst({
    where: { credits, active: true, isCustom: false },
  });

  let price: number;
  let packageName: string;
  let packageId: string | null = null;

  if (pkg) {
    price       = pkg.priceArs;
    packageName = pkg.name;
    packageId   = pkg.id;
  } else {
    // Custom amount — find the custom package config for per-credit price
    const customPkg = await prisma.creditPackage.findFirst({
      where: { isCustom: true, active: true },
    });
    const pricePerCredit = customPkg?.pricePerCredit ?? 100;

    if (credits < MIN_CUSTOM) {
      return NextResponse.json({ error: `Mínimo ${MIN_CUSTOM} créditos` }, { status: 400 });
    }
    if (credits > MAX_CUSTOM) {
      return NextResponse.json(
        { error: `Máximo ${MAX_CUSTOM.toLocaleString("es-AR")} créditos` },
        { status: 400 }
      );
    }
    price       = credits * pricePerCredit;
    packageName = `${credits} créditos personalizados`;
    packageId   = customPkg?.id ?? null;
  }

  const purchaseId = randomUUID();

  try {
    await prisma.creditPurchase.create({
      data: {
        id:         purchaseId,
        userId:     session.user.id,
        packageId,
        credits,
        amount:     price,
        currency:   "ARS",
        status:     "pending",
        packageName,
      },
    });

    const client    = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [{
          id:         `credits-${credits}`,
          title:      `${credits} créditos — 100Mxley`,
          quantity:   1,
          unit_price: price,
          currency_id: "ARS",
        }],
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

    await prisma.creditPurchase.update({
      where: { id: purchaseId },
      data:  { mpPreferenceId: result.id ?? null },
    });

    console.log(`[MP_PREFERENCE_CREATED] userId=${session.user.id} credits=${credits} price=${price} pkg=${packageName}`);

    return NextResponse.json({ url: result.init_point });
  } catch (err: any) {
    console.error("[MP_CREATE_PREFERENCE_ERROR]", err?.message ?? err);
    await prisma.creditPurchase.update({
      where: { id: purchaseId },
      data:  { status: "cancelled" },
    }).catch(() => {});
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 });
  }
}
