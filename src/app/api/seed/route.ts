import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    // 1. Crear Usuario Admin
    const adminEmail = "admin@100mxley.com";
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password: hashedPassword },
      create: {
        id: randomUUID(),
        email: adminEmail,
        name: "Admin 100MxLey",
        password: hashedPassword,
        credits: 500,
      },
    });

    // 2. Crear una tienda de ejemplo (Tiendanube)
    const store = await prisma.store.upsert({
      where: { platform_storeId: { platform: "tiendanube", storeId: "123456" } },
      update: {},
      create: {
        id: randomUUID(),
        userId: user.id,
        platform: "tiendanube",
        storeId: "123456",
        storeName: "Mi Tienda Demo",
        accessToken: "si_token_falso_123",
        domain: "mitiendademo.com",
      },
    });

    // 3. Crear algunas órdenes de ejemplo
    await prisma.order.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: "ORD-001" } },
      update: {},
      create: {
        id: randomUUID(),
        storeId: store.id,
        userId: user.id,
        externalId: "ORD-001",
        buyerName: "Juan Perez",
        buyerEmail: "juan.perez@email.com",
        address: JSON.stringify({ city: "CDMX", street: "Av. Reforma 123", zip: "06000" }),
        products: JSON.stringify([
          { name: "Producto A", quantity: 2, price: 150 },
          { name: "Producto B", quantity: 1, price: 200 },
        ]),
        totalAmount: 500,
        status: "pending",
        exported: false,
        notified: false,
      },
    });

    await prisma.order.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: "ORD-002" } },
      update: {},
      create: {
        id: randomUUID(),
        storeId: store.id,
        userId: user.id,
        externalId: "ORD-002",
        buyerName: "Maria Garcia",
        buyerEmail: "maria.garcia@email.com",
        address: JSON.stringify({ city: "Monterrey", street: "Calle 5 de Mayo 456", zip: "64000" }),
        products: JSON.stringify([
          { name: "Producto C", quantity: 1, price: 1200 },
        ]),
        totalAmount: 1200,
        status: "shipped",
        exported: true,
        notified: true,
      },
    });

    // 4. Crear una transacción de ejemplo
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        type: "charge",
        amount: 500,
        description: "Carga inicial de créditos (Seed)",
        reference: "SEED_INIT",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Base de datos poblada con éxito.",
      credentials: {
        email: adminEmail,
        password: "admin123"
      },
      dataCreated: {
        user: user.name,
        store: store.storeName,
        orders: 2,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
