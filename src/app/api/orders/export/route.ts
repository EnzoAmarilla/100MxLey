export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import bwipjs from "bwip-js";

// A6 in points (105mm × 148mm)
const A6W = 297.638;
const A6H = 419.528;
const M   = 22; // margin

async function buildLabel(
  pdfDoc: PDFDocument,
  fontBold: Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  font:     Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  order: any
) {
  const page    = pdfDoc.addPage([A6W, A6H]);
  const address = order.address as any;
  const products = order.products as any[];

  // ── Barcode PNG ──────────────────────────────────────────────
  const barcodePng = await bwipjs.toBuffer({
    bcid: "code128",
    text: order.externalId,
    scale: 2,
    height: 9,
    includetext: false,
  });
  const barcodeImg    = await pdfDoc.embedPng(barcodePng);
  const barcodeW      = A6W - M * 2;
  const barcodeH      = 36;

  // ── Header ───────────────────────────────────────────────────
  const headerY = A6H - M;

  page.drawText(order.store.storeName, {
    x: M, y: headerY - 14, size: 13, font: fontBold, color: rgb(0,0,0),
  });

  const numStr  = `#${order.externalId}`;
  const numW    = font.widthOfTextAtSize(numStr, 9);
  page.drawText(numStr, {
    x: A6W - M - numW, y: headerY - 14, size: 9, font, color: rgb(0.35,0.35,0.35),
  });

  page.drawLine({
    start: { x: M, y: headerY - 22 }, end: { x: A6W - M, y: headerY - 22 },
    thickness: 1.5, color: rgb(0,0,0),
  });

  // ── Barcode ──────────────────────────────────────────────────
  let y = headerY - 28;
  page.drawImage(barcodeImg, { x: M, y: y - barcodeH, width: barcodeW, height: barcodeH });

  const codeStr = order.externalId;
  const codeW   = font.widthOfTextAtSize(codeStr, 7);
  page.drawText(codeStr, {
    x: A6W / 2 - codeW / 2, y: y - barcodeH - 10, size: 7, font, color: rgb(0.4,0.4,0.4),
  });

  y -= barcodeH + 18;

  // ── Separator ────────────────────────────────────────────────
  page.drawLine({
    start: { x: M, y }, end: { x: A6W - M, y },
    thickness: 0.4, color: rgb(0.78,0.78,0.78),
  });
  y -= 13;

  // ── DESTINATARIO ─────────────────────────────────────────────
  page.drawText("DESTINATARIO", { x: M, y, size: 7, font: fontBold, color: rgb(0.5,0.5,0.5) });
  y -= 13;
  page.drawText(order.buyerName, { x: M, y, size: 12, font: fontBold });
  y -= 13;

  if (address.street) {
    page.drawText(address.street, { x: M, y, size: 9, font });
    y -= 12;
  }
  const city = [address.city, address.province].filter(Boolean).join(", ");
  if (city) {
    page.drawText(city, { x: M, y, size: 9, font });
    y -= 12;
  }
  const zip = address.zip || address.zipcode;
  if (zip) {
    page.drawText(`CP: ${zip}`, { x: M, y, size: 9, font, color: rgb(0.4,0.4,0.4) });
    y -= 12;
  }

  y -= 5;
  page.drawLine({
    start: { x: M, y }, end: { x: A6W - M, y },
    thickness: 0.4, color: rgb(0.78,0.78,0.78),
  });
  y -= 13;

  // ── PRODUCTOS ────────────────────────────────────────────────
  page.drawText("PRODUCTOS", { x: M, y, size: 7, font: fontBold, color: rgb(0.5,0.5,0.5) });
  y -= 13;

  for (const p of products) {
    page.drawText(`${p.sku}  ×  ${p.quantity}`, { x: M, y, size: 10, font: fontBold });
    y -= 12;
  }

  // ── Courier ──────────────────────────────────────────────────
  if (order.courier) {
    y -= 5;
    page.drawLine({
      start: { x: M, y }, end: { x: A6W - M, y },
      thickness: 0.4, color: rgb(0.78,0.78,0.78),
    });
    y -= 13;
    page.drawText(`Courier: ${order.courier}`, { x: M, y, size: 10, font: fontBold });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { orderIds } = await req.json();
    if (!orderIds?.length) {
      return NextResponse.json({ error: "No se seleccionaron pedidos" }, { status: 400 });
    }

    // Verificar créditos y obtener pedidos en paralelo
    const [user, orders] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
      prisma.order.findMany({
        where: { id: { in: orderIds }, userId: session.user.id },
        include: { store: { select: { storeName: true } } },
      }),
    ]);

    const requiredCredits = orderIds.length * CREDIT_COSTS.EXPORT_LABEL;
    if (!user || user.credits < requiredCredits) {
      return NextResponse.json(
        { error: `Créditos insuficientes. Necesitás ${requiredCredits} (tenés ${user?.credits ?? 0})` },
        { status: 400 }
      );
    }
    if (!orders.length) {
      return NextResponse.json({ error: "No se encontraron pedidos" }, { status: 404 });
    }

    // Generar PDF con pdf-lib (sin browser)
    const pdfDoc   = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Generar todas las páginas en paralelo
    await Promise.all(orders.map((order) => buildLabel(pdfDoc, fontBold, font, order)));

    const pdfBytes = await pdfDoc.save();

    // Descontar créditos y marcar exportados en paralelo
    await Promise.all([
      deductCredits(session.user.id, requiredCredits, `Exportación de ${orders.length} rótulo(s)`),
      prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { exported: true } }),
    ]);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rotulos-${Date.now()}.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err.message || "Error al exportar rótulos" }, { status: 500 });
  }
}
