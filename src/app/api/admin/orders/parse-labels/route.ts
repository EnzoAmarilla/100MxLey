export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
// pdf-parse exposes a CJS default; the esm shim lacks a default export so we
// import the whole module and reach into the callable export manually.
import * as pdfParseModule from "pdf-parse";
const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
  (pdfParseModule as any).default ?? (pdfParseModule as any);

// ── Regex patterns to find our "Numero Interno" in an Andreani label PDF ──────
// Andreani typically renders it near keywords like "Interno", "Referencia", "Ref"
const ORDER_NUM_PATTERNS = [
  /n[uú]mero?\s+interno\s*[:\-]?\s*(\w+)/i,
  /n[°º]\.?\s*int(?:erno)?\s*[:\-]?\s*(\w+)/i,
  /referencia\s*[:\-]?\s*(\w+)/i,
  /ref\.?\s*[:\-]?\s*(\w+)/i,
  /interno\s*[:\-]?\s*(\w+)/i,
];

function extractOrderNumber(text: string): string | null {
  for (const pattern of ORDER_NUM_PATTERNS) {
    const m = text.match(pattern);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

// Also try to extract the Andreani tracking code (usually 20-digit numeric string)
function extractAndreaniTracking(text: string): string | null {
  const m = text.match(/\b(\d{20})\b/);
  return m?.[1] ?? null;
}

async function findOrder(clientId: string, numStr: string) {
  const num = parseInt(numStr, 10);

  // Search by orderNumber (integer) — what we put as "Numero Interno" in most cases
  if (!isNaN(num)) {
    const byNumber = await prisma.order.findFirst({
      where: { userId: clientId, orderNumber: num },
    });
    if (byNumber) return byNumber;
  }

  // Fallback: search by externalId (string) — used when orderNumber is null
  return prisma.order.findFirst({
    where: { userId: clientId, externalId: numStr },
  });
}

interface ParsedProduct {
  name:          string;
  sku:           string;
  quantity:      number;
  variantValues: string[];
}

function parseProducts(
  productsJson: string | null,
  rawPayload: unknown,
): ParsedProduct[] {
  try {
    const parsed: any[] = JSON.parse(productsJson || "[]");
    const raw = (typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload) as any;

    return parsed.map((p: any, i: number) => {
      const rawP = raw?.products?.[i] ?? {};
      let sku: string = p.sku ?? "";

      // If SKU contains packaging info (not a real SKU), use product_id as fallback
      if (!sku || /unidad|pack|%/i.test(sku)) {
        sku = String(rawP.product_id ?? p.sku ?? "");
      }

      return {
        name:          p.name ?? "",
        sku,
        quantity:      Number(p.quantity) || 1,
        variantValues: Array.isArray(p.variant_values) ? p.variant_values : [],
      };
    });
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const clientId = (formData.get("clientId") as string | null)?.trim();
  const files    = formData.getAll("files") as File[];

  if (!clientId) {
    return NextResponse.json({ error: "Seleccioná un cliente primero" }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ error: "No se recibieron archivos PDF" }, { status: 400 });
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const base = { filename: file.name };

      try {
        const buf  = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buf);
        const text = data.text ?? "";

        const extractedNumber  = extractOrderNumber(text);
        const andreaniTracking = extractAndreaniTracking(text);

        if (!extractedNumber) {
          return { ...base, status: "not_found" as const, reason: "Número de orden no encontrado en el PDF" };
        }

        const order = await findOrder(clientId, extractedNumber);

        if (!order) {
          return {
            ...base,
            status:          "not_found" as const,
            extractedNumber,
            andreaniTracking,
            reason:          `Pedido "${extractedNumber}" no existe para este cliente`,
          };
        }

        // Persist the Andreani tracking on the order if we extracted it and it's new
        if (andreaniTracking && !order.trackingCode) {
          await prisma.order.update({
            where: { id: order.id },
            data:  { trackingCode: andreaniTracking },
          }).catch(() => {/* non-critical */});
        }

        const products = parseProducts(order.products, order.rawPayload);

        return {
          ...base,
          status:          "found" as const,
          extractedNumber,
          andreaniTracking,
          order: {
            id:          order.id,
            orderNumber: order.orderNumber ?? order.externalId,
            buyerName:   order.buyerName,
            buyerEmail:  order.buyerEmail,
            products,
          },
        };
      } catch (err: any) {
        return {
          ...base,
          status: "error" as const,
          reason: err?.message ?? "Error al procesar el PDF",
        };
      }
    }),
  );

  const found    = results.filter((r) => r.status === "found").length;
  const notFound = results.filter((r) => r.status !== "found").length;

  return NextResponse.json({ results, found, notFound });
}
