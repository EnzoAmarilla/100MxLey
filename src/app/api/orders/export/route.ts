export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import puppeteer from "puppeteer";
import bwipjs from "bwip-js";

async function generateBarcode(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { orderIds } = await req.json();

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { error: "No se seleccionaron pedidos" },
        { status: 400 }
      );
    }

    // Verify credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const requiredCredits = orderIds.length * CREDIT_COSTS.EXPORT_LABEL;
    if (!user || user.credits < requiredCredits) {
      return NextResponse.json(
        {
          error: `Créditos insuficientes. Necesitás ${requiredCredits} créditos (tenés ${user?.credits ?? 0})`,
        },
        { status: 400 }
      );
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId: session.user.id,
      },
      include: { store: true },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron pedidos" },
        { status: 404 }
      );
    }

    // Generate label HTML
    const labels = await Promise.all(
      orders.map(async (order) => {
        const address = order.address as any;
        const products = order.products as any[];
        const barcode = await generateBarcode(order.externalId);

        return `
          <div class="label">
            <div class="header">
              <div class="store-name">${order.store.storeName}</div>
              <div class="order-num">Pedido #${order.externalId}</div>
            </div>
            <div class="barcode">
              <img src="${barcode}" alt="barcode" />
            </div>
            <div class="section">
              <div class="section-title">DESTINATARIO</div>
              <div class="buyer-name">${order.buyerName}</div>
              <div>${address.street || ""}</div>
              <div>${address.city || ""}, ${address.province || ""}</div>
              <div>CP: ${address.zipcode || ""}</div>
            </div>
            <div class="section">
              <div class="section-title">PRODUCTOS</div>
              ${products
                .map(
                  (p) =>
                    `<div class="product"><span class="sku">${p.sku}</span> × ${p.quantity}</div>`
                )
                .join("")}
            </div>
            ${
              order.courier
                ? `<div class="courier">Courier: ${order.courier}</div>`
                : ""
            }
          </div>
        `;
      })
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A6; margin: 8mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .label {
            page-break-after: always;
            padding: 10px;
            height: 100%;
          }
          .label:last-child { page-break-after: auto; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .store-name { font-size: 16px; font-weight: bold; }
          .order-num { font-size: 12px; color: #333; }
          .barcode { text-align: center; margin: 10px 0; }
          .barcode img { max-width: 100%; height: auto; }
          .section { margin: 10px 0; }
          .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #666;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .buyer-name { font-size: 14px; font-weight: bold; }
          .product { margin: 2px 0; }
          .sku { font-weight: bold; font-size: 14px; }
          .courier {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #ccc;
            font-weight: bold;
          }
        </style>
      </head>
      <body>${labels.join("")}</body>
      </html>
    `;

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A6",
      printBackground: true,
    });
    await browser.close();

    // Deduct credits
    await deductCredits(
      session.user.id,
      requiredCredits,
      `Exportación de ${orders.length} rótulo(s)`
    );

    // Mark orders as exported
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { exported: true },
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rotulos-${Date.now()}.pdf`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al exportar rótulos" },
      { status: 500 }
    );
  }
}
