import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type Store = {
  id: string;
  storeId: string;
  accessToken: string;
};

function tnName(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val.es ?? val.pt ?? val.en ?? Object.values(val)[0] ?? "";
}

export async function syncTiendanubeProducts(store: Store, userId: string): Promise<number> {
  const PER_PAGE = 200;
  let page = 1;
  const allProducts: any[] = [];

  // Fetch all products (paginated)
  while (true) {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${store.storeId}/products?per_page=${PER_PAGE}&page=${page}`,
      {
        headers: {
          Authentication: `bearer ${store.accessToken}`,
          "User-Agent": "100Mxley (support@100mxley.com)",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[TN_PRODUCTS_SYNC_ERROR]", err);
      throw new Error("Error al consultar productos de Tiendanube");
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < PER_PAGE) break;
    page++;
  }

  // Compute soldMonth from this month's non-cancelled orders
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthOrders = await prisma.order.findMany({
    where: { storeId: store.id, status: { not: "cancelled" }, createdAt: { gte: monthStart } },
    select: { products: true },
  });

  const soldBySku: Record<string, number> = {};
  for (const o of monthOrders) {
    const prods: any[] = typeof o.products === "string" ? JSON.parse(o.products) : (o.products as any[]) ?? [];
    for (const p of prods) {
      const sku = String(p.sku || "").toUpperCase().trim();
      if (sku && sku !== "N/A") soldBySku[sku] = (soldBySku[sku] ?? 0) + (p.quantity ?? 1);
    }
  }

  let upserted = 0;

  for (const tnProduct of allProducts) {
    const productName = tnName(tnProduct.name);
    const category    = tnName(tnProduct.categories?.[0]?.name) || "Otro";
    const variants: any[] = tnProduct.variants ?? [];

    for (const variant of variants) {
      const externalId = String(variant.id);
      const rawSku     = String(variant.sku || "").trim();
      const effectiveSku = rawSku ? rawSku.toUpperCase() : `TN-${externalId}`;

      // Build display name: append variant values if there are multiple variants or if values exist
      const variantLabel = (variant.values ?? []).map((v: any) => tnName(v)).filter(Boolean).join(" / ");
      const displayName  = variantLabel ? `${productName} - ${variantLabel}` : productName;

      const stock      = variant.stock                    ?? 0;
      const salePrice  = parseFloat(variant.price            ?? "0") || 0;
      const costPrice  = parseFloat(variant.cost             ?? "0") || 0;
      const promoPrice = parseFloat(variant.promotional_price ?? "0") || null;
      const soldMonth  = soldBySku[effectiveSku] ?? 0;

      try {
        await prisma.product.upsert({
          where: {
            storeId_externalId: { storeId: store.id, externalId },
          },
          update: {
            sku:        effectiveSku,
            name:       displayName,
            category,
            stock,
            salePrice,
            promoPrice,
            costPrice,
            soldMonth,
            platform:   "tiendanube",
          },
          create: {
            id:         randomUUID(),
            userId,
            storeId:    store.id,
            platform:   "tiendanube",
            externalId,
            sku:        effectiveSku,
            name:       displayName,
            category,
            stock,
            minStock:   0,
            salePrice,
            promoPrice,
            costPrice,
            soldMonth,
          },
        });
      } catch (e: any) {
        // SKU already exists as a manual product — link it to TN instead
        if (e.code === "P2002") {
          await prisma.product.updateMany({
            where: { userId, sku: effectiveSku },
            data: { storeId: store.id, externalId, platform: "tiendanube", stock, salePrice, promoPrice, costPrice, soldMonth },
          });
        } else {
          console.error("[TN_PRODUCTS_UPSERT_ERROR]", externalId, e?.message);
        }
      }

      upserted++;
    }
  }

  await prisma.store.update({
    where: { id: store.id },
    data:  { lastProductSync: new Date() },
  });

  return upserted;
}
