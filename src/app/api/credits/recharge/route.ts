export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { credits, amount } = await req.json();

    if (!credits || !amount || credits <= 0) {
      return NextResponse.json(
        { error: "Cantidad de créditos inválida" },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `credits-${credits}`,
            title: `${credits} créditos — 100Mxley`,
            quantity: 1,
            unit_price: amount,
            currency_id: "ARS",
          },
        ],
        external_reference: `${session.user.id}|${credits}`,
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/credits?payment=success`,
          failure: `${process.env.NEXTAUTH_URL}/credits?payment=failure`,
          pending: `${process.env.NEXTAUTH_URL}/credits?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      },
    });

    return NextResponse.json({ url: result.init_point });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
