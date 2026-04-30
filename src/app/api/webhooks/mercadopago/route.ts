export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  console.log("[MP_WEBHOOK_RECEIVED]", JSON.stringify({ type: body.type, action: body.action, id: body.data?.id }));

  // Only process payment events
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: body.data.id });

    const mpPaymentId = String(paymentData.id);
    const status = paymentData.status ?? "unknown";

    console.log(`[MP_WEBHOOK_PAYMENT] id=${mpPaymentId} status=${status}`);

    // Parse external_reference: userId|credits|purchaseId
    const externalRef = paymentData.external_reference ?? "";
    const parts = externalRef.split("|");
    const userId = parts[0];
    const creditsAmount = parseInt(parts[1], 10);
    const purchaseId = parts[2] ?? null;

    if (!userId || !creditsAmount || isNaN(creditsAmount)) {
      console.error("[MP_WEBHOOK] Invalid external_reference:", externalRef);
      return NextResponse.json({ error: "Referencia inválida" }, { status: 400 });
    }

    // Handle non-approved statuses — update purchase record if applicable
    if (status !== "approved") {
      if (purchaseId && ["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
        await prisma.creditPurchase.updateMany({
          where: { id: purchaseId, status: "pending" },
          data: { status, mpPaymentId },
        });
        console.log(`[MP_WEBHOOK] Purchase ${purchaseId} marked as ${status}`);
      }
      return NextResponse.json({ ok: true });
    }

    // --- Payment approved ---

    // Idempotency: check if this paymentId was already credited
    const alreadyProcessed = await prisma.transaction.findFirst({
      where: { reference: mpPaymentId, type: "credit" },
    });
    if (alreadyProcessed) {
      console.log(`[MP_WEBHOOK] Payment ${mpPaymentId} already processed — skipping`);
      return NextResponse.json({ ok: true });
    }

    const now = new Date();

    // Atomic: mark purchase approved + increment credits + create transaction
    await prisma.$transaction(async (tx) => {
      if (purchaseId) {
        await tx.creditPurchase.updateMany({
          where: { id: purchaseId, status: "pending" },
          data: { status: "approved", mpPaymentId, approvedAt: now },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: creditsAmount } },
      });

      await tx.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          type: "credit",
          amount: creditsAmount,
          description: `Recarga vía Mercado Pago — ${creditsAmount} créditos`,
          reference: mpPaymentId,
        },
      });
    });

    console.log(
      `[MP_WEBHOOK_APPROVED] userId=${userId} credits=+${creditsAmount} paymentId=${mpPaymentId} purchaseId=${purchaseId}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MP_WEBHOOK_ERROR]", err);
    return NextResponse.json({ error: "Error procesando pago" }, { status: 500 });
  }
}
