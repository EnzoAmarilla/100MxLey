export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { orderIds } = await req.json();

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId: session.user.id,
        exported: true,
        notified: false,
      },
      include: { store: true },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No hay pedidos para notificar" },
        { status: 400 }
      );
    }

    const requiredCredits = orders.length * CREDIT_COSTS.SEND_NOTIFICATION;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.credits < requiredCredits) {
      return NextResponse.json(
        { error: "Créditos insuficientes para enviar notificaciones" },
        { status: 400 }
      );
    }

    const results: { orderId: string; success: boolean; error?: string }[] = [];

    for (const order of orders) {
      try {
        if (order.store.platform === "tiendanube") {
          // Mark as shipped in Tiendanube - triggers native email
          await fetch(
            `https://api.tiendanube.com/v1/${order.store.storeId}/orders/${order.externalId}/fulfill`,
            {
              method: "POST",
              headers: {
                Authentication: `bearer ${order.store.accessToken}`,
                "Content-Type": "application/json",
                "User-Agent": "100Mxley (support@100mxley.com)",
              },
              body: JSON.stringify({
                shipping_tracking_number: order.trackingCode || "",
              }),
            }
          );
        } else if (order.store.platform === "shopify") {
          // Create fulfillment in Shopify
          await fetch(
            `https://${order.store.domain}/admin/api/2024-01/orders/${order.externalId}/fulfillments.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": order.store.accessToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fulfillment: {
                  tracking_number: order.trackingCode || "",
                  notify_customer: true,
                },
              }),
            }
          );
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { notified: true, status: "shipped" },
        });

        results.push({ orderId: order.id, success: true });
      } catch (err: any) {
        results.push({
          orderId: order.id,
          success: false,
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    if (successCount > 0) {
      await deductCredits(
        session.user.id,
        successCount * CREDIT_COSTS.SEND_NOTIFICATION,
        `Notificación de ${successCount} pedido(s) enviado(s)`
      );
    }

    return NextResponse.json({
      message: `${successCount} de ${orders.length} pedidos marcados como enviados`,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al notificar" },
      { status: 500 }
    );
  }
}
