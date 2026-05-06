import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { logisticsAccessEnabled: true },
  });
  if (!clientRecord?.logisticsAccessEnabled) {
    return NextResponse.json({ error: "La sección Pedidos / Logística todavía no está habilitada para tu cuenta." }, { status: 403 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id }, // Ensures client can only see their own orders
    select: {
      id:               true,
      externalId:       true,
      buyerName:        true,
      buyerEmail:       true,
      address:          true,
      products:         true,
      status:           true,
      operationalStatus: true,
      clientNote:       true,
      totalAmount:      true,
      shippingCost:     true,
      trackingCode:     true,
      courier:          true,
      createdAt:        true,
      orderStatusHistory: {
        orderBy: { changedAt: "asc" },
        select: {
          id:         true,
          oldStatus:  true,
          newStatus:  true,
          clientNote: true,
          changedAt:  true,
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}
