export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkLogisticsAccess(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { logisticsAccessEnabled: true } });
  return u?.logisticsAccessEnabled ?? false;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await checkLogisticsAccess(session.user.id))) {
    return NextResponse.json({ error: "La sección Pedidos / Logística todavía no está habilitada para tu cuenta." }, { status: 403 });
  }

  const requests = await prisma.pickupRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          oldStatus: true,
          newStatus: true,
          clientNote: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await checkLogisticsAccess(session.user.id))) {
    return NextResponse.json({ error: "La sección Pedidos / Logística todavía no está habilitada para tu cuenta." }, { status: 403 });
  }

  const body = await req.json();
  const {
    address, city, province, postalCode,
    packageCount, packageSize, estimatedWeight,
    preferredDate, preferredTimeSlot, shippingType,
    observations, needsPackagingHelp, alreadyLabeled,
    hasFulfillmentProducts, needsQuote,
  } = body;

  if (!address || !city || !province || !postalCode || !packageCount || !packageSize || !preferredDate || !preferredTimeSlot || !shippingType) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const request = await prisma.pickupRequest.create({
    data: {
      id: crypto.randomUUID(),
      userId: session.user.id,
      address,
      city,
      province,
      postalCode,
      packageCount: Number(packageCount),
      packageSize,
      estimatedWeight: estimatedWeight || null,
      preferredDate,
      preferredTimeSlot,
      shippingType,
      observations: observations || null,
      needsPackagingHelp: Boolean(needsPackagingHelp),
      alreadyLabeled: Boolean(alreadyLabeled),
      hasFulfillmentProducts: Boolean(hasFulfillmentProducts),
      needsQuote: Boolean(needsQuote),
      status: "pendiente",
    },
  });

  await prisma.pickupRequestHistory.create({
    data: {
      id: crypto.randomUUID(),
      pickupRequestId: request.id,
      oldStatus: null,
      newStatus: "pendiente",
      clientNote: "Solicitud creada correctamente.",
      changedById: session.user.id,
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}
