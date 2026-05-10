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
const M   = 20; // margin

const BLACK = rgb(0,    0,    0   );
const DGRAY = rgb(0.18, 0.18, 0.18);
const GRAY  = rgb(0.45, 0.45, 0.45);
const LGRAY = rgb(0.72, 0.72, 0.72);

function safeParseJSON(val: unknown): any {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val ?? null;
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function divider(page: any, y: number, thickness = 0.5, color = LGRAY) {
  page.drawLine({ start: { x: M, y }, end: { x: A6W - M, y }, thickness, color });
}

function label(page: any, text: string, x: number, y: number, font: any, size: number, color = BLACK) {
  page.drawText(text, { x, y, size, font, color });
}

async function buildLabel(
  pdfDoc: PDFDocument,
  fontBold: Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  font:     Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  order: any
) {
  const page = pdfDoc.addPage([A6W, A6H]);

  // Parse stored JSON strings
  const address  = safeParseJSON(order.address)  ?? {};
  const products = safeParseJSON(order.products)  ?? [];
  const raw      = safeParseJSON(order.rawPayload as any) ?? order.rawPayload ?? {};

  const storeName  = order.store?.storeName || "100Mxley";
  const buyerPhone = raw?.customer?.phone ?? null;

  // ── Barcode ──────────────────────────────────────────────────────
  const barcodeText = String(order.externalId);
  const barcodePng  = await bwipjs.toBuffer({
    bcid:        "code128",
    text:        barcodeText,
    scale:       2,
    height:      10,
    includetext: false,
  });
  const barcodeImg = await pdfDoc.embedPng(barcodePng);
  const barcodeW   = A6W - M * 2;
  const barcodeH   = 36;

  let y = A6H - M;

  // ── HEADER ───────────────────────────────────────────────────────
  label(page, truncate(storeName, 28), M, y - 14, fontBold, 13, BLACK);

  const numStr = `#${order.externalId}`;
  const numW   = fontBold.widthOfTextAtSize(numStr, 10);
  label(page, numStr, A6W - M - numW, y - 14, fontBold, 10, GRAY);

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      })
    : "";
  if (orderDate) {
    const dw = font.widthOfTextAtSize(orderDate, 7);
    label(page, orderDate, A6W - M - dw, y - 25, font, 7, LGRAY);
  }

  y -= 28;
  page.drawLine({ start: { x: M, y }, end: { x: A6W - M, y }, thickness: 1.8, color: BLACK });

  // ── BARCODE ──────────────────────────────────────────────────────
  y -= 6;
  page.drawImage(barcodeImg, { x: M, y: y - barcodeH, width: barcodeW, height: barcodeH });

  const codeW = font.widthOfTextAtSize(barcodeText, 7);
  label(page, barcodeText, A6W / 2 - codeW / 2, y - barcodeH - 9, font, 7, GRAY);

  y -= barcodeH + 18;
  divider(page, y);

  // ── DESTINATARIO ─────────────────────────────────────────────────
  y -= 11;
  label(page, "DESTINATARIO", M, y, fontBold, 6.5, GRAY);
  y -= 14;

  label(page, truncate(order.buyerName || "Sin nombre", 34), M, y, fontBold, 12, BLACK);
  y -= 14;

  if (buyerPhone) {
    label(page, String(buyerPhone), M, y, font, 8.5, DGRAY);
    y -= 12;
  }

  const street = [address.street, address.number].filter(Boolean).join(" ");
  const streetFull = address.floor ? `${street}, ${address.floor}` : street;
  if (streetFull) {
    label(page, truncate(streetFull, 42), M, y, font, 9, DGRAY);
    y -= 12;
  }

  const locality = address.locality || address.city || "";
  const cityLine = [locality, address.province].filter(Boolean).join(", ");
  if (cityLine) {
    label(page, truncate(cityLine, 42), M, y, font, 9, DGRAY);
    y -= 12;
  }

  const zip = address.zipcode || address.zip;
  if (zip) {
    label(page, `CP: ${zip}`, M, y, font, 9, GRAY);
    y -= 12;
  }

  y -= 4;
  divider(page, y);

  // ── PRODUCTOS ────────────────────────────────────────────────────
  y -= 11;
  label(page, "PRODUCTOS", M, y, fontBold, 6.5, GRAY);
  y -= 13;

  const safeProducts = Array.isArray(products) ? products : [];
  for (const p of safeProducts) {
    if (y < 60) break;

    const name = typeof p.name === "string" && p.name ? p.name : "Producto";
    const qty  = typeof p.quantity === "number" ? p.quantity : 1;

    label(page, `${qty} × ${truncate(name, 36)}`, M, y, fontBold, 9.5, BLACK);
    y -= 11;

    const skuRaw     = typeof p.sku === "string" && p.sku ? p.sku : null;
    const skuPart    = skuRaw && skuRaw !== "N/A" ? `SKU: ${skuRaw}` : null;
    const variantArr = Array.isArray(p.variant_values) ? p.variant_values.filter(Boolean) : [];
    const varPart    = variantArr.length ? variantArr.join(" / ") : null;

    const subParts = [skuPart, varPart].filter(Boolean);
    const subLine  = subParts.length ? subParts.join("  ·  ") : "SKU no configurado";

    label(page, truncate(subLine, 46), M + 2, y, font, 7.5, LGRAY);
    y -= 13;
  }

  // ── LOGÍSTICA ────────────────────────────────────────────────────
  if (y > 54) {
    y -= 3;
    divider(page, y);
    y -= 11;
    label(page, "LOGÍSTICA", M, y, fontBold, 6.5, GRAY);
    y -= 13;

    if (order.trackingCode) {
      label(page, "Tracking:", M, y, font, 8, GRAY);
      const twW = font.widthOfTextAtSize("Tracking: ", 8);
      label(page, truncate(String(order.trackingCode), 36), M + twW, y, fontBold, 8.5, BLACK);
    } else {
      label(page, "Sin tracking asignado", M, y, font, 8.5, LGRAY);
    }
    y -= 12;

    if (order.courier) {
      label(page, `Courier: ${truncate(order.courier, 30)}`, M, y, font, 8.5, DGRAY);
    }
  }

  // ── PRINT DATE (footer) ──────────────────────────────────────────
  const printDate = new Date().toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const printStr = `Impreso: ${printDate}`;
  const printW   = font.widthOfTextAtSize(printStr, 6.5);
  divider(page, M + 14, 0.3, LGRAY);
  label(page, printStr, A6W / 2 - printW / 2, M + 4, font, 6.5, LGRAY);
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

    const [user, orders] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
      prisma.order.findMany({
        where:   { id: { in: orderIds }, userId: session.user.id },
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

    const pdfDoc   = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Build labels sequentially to avoid race conditions on pdfDoc
    for (const order of orders) {
      await buildLabel(pdfDoc, fontBold, font, order);
    }

    const pdfBytes = await pdfDoc.save();

    await Promise.all([
      deductCredits(session.user.id, requiredCredits, `Exportación de ${orders.length} rótulo(s)`),
      prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { exported: true } }),
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    const fname   = orders.length === 1
      ? `rotulo-TN${orders[0].externalId}.pdf`
      : `rotulos-${dateTag}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename=${fname}`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err.message || "Error al exportar rótulos" }, { status: 500 });
  }
}
