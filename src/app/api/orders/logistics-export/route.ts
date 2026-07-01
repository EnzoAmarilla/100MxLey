export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeOrderForLogistics,
  validateOrderForExport,
  generateAndreaniHomeCSV,
  generateAndreaniBranchCSV,
  generateCorreoArgentinoCSV,
  type LogisticsProvider,
  type AndreaniType,
  type NormalizedOrder,
  type ValidationError,
  type ExportFormat,
} from "@/lib/logistics-export";
import { generateAndreaniHomeXLSX, generateAndreaniBranchXLSX } from "@/lib/andreani-xlsx-export";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      orderIds,
      provider,
      shippingType,
      validateOnly = false,
      format = "xlsx",
    } = body as {
      orderIds:     string[];
      provider:     LogisticsProvider;
      shippingType: AndreaniType | null;
      validateOnly?: boolean;
      format?:      ExportFormat;
    };

    if (!orderIds?.length)
      return NextResponse.json({ error: "No se seleccionaron pedidos" }, { status: 400 });
    if (!provider)
      return NextResponse.json({ error: "Seleccioná una logística" }, { status: 400 });
    if (provider === "andreani" && !shippingType)
      return NextResponse.json({ error: "Seleccioná el tipo de envío para Andreani" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where:   { id: { in: orderIds }, userId: session.user.id },
      include: { store: { select: { storeName: true, platform: true } } },
    });

    if (!orders.length)
      return NextResponse.json({ error: "No se encontraron pedidos" }, { status: 404 });

    const normalized: NormalizedOrder[] = orders.map((o) => {
      return normalizeOrderForLogistics(o);
    });

    // Validate every order
    const validationErrors: ValidationError[] = normalized
      .map((norm) => ({
        orderId:     norm.orderId,
        orderNumber: norm.orderNumber,
        errors:      validateOrderForExport(norm, provider, shippingType ?? undefined),
      }))
      .filter((v) => v.errors.length > 0);

    if (validateOnly) {
      return NextResponse.json({ validationErrors });
    }

    if (validationErrors.length) {
      return NextResponse.json({
        error: `${validationErrors.length} pedido(s) con datos incompletos`,
        validationErrors,
      }, { status: 422 });
    }

    // Generate files
    let files: { filename: string; content: string; encoding?: string; mimeType?: string }[];

    if (provider === "andreani") {
      const isHome = shippingType === "domicilio";
      files = [
        format === "csv"
          ? (isHome ? generateAndreaniHomeCSV(normalized) : generateAndreaniBranchCSV(normalized))
          : await (isHome ? generateAndreaniHomeXLSX(normalized) : generateAndreaniBranchXLSX(normalized)),
      ];
    } else {
      files = generateCorreoArgentinoCSV(normalized);
    }

    return NextResponse.json({
      success:       true,
      files,
      exportedCount: orders.length,
      fileCount:     files.length,
    });
  } catch (err: any) {
    console.error("[LOGISTICS_EXPORT]", err);
    return NextResponse.json({ error: err.message || "Error al exportar" }, { status: 500 });
  }
}
