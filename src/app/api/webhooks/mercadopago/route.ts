export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { addCredits } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type !== "payment" || body.action !== "payment.created") {
      return NextResponse.json({ ok: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: body.data.id });

    if (paymentData.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const externalRef = paymentData.external_reference;
    if (!externalRef) {
      return NextResponse.json({ error: "Sin referencia" }, { status: 400 });
    }

    const [userId, creditsStr] = externalRef.split("|");
    const creditsAmount = parseFloat(creditsStr);

    if (!userId || !creditsAmount) {
      return NextResponse.json({ error: "Referencia inválida" }, { status: 400 });
    }

    await addCredits(
      userId,
      creditsAmount,
      `Recarga de ${creditsAmount} créditos`,
      String(paymentData.id)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error procesando pago" },
      { status: 500 }
    );
  }
}
