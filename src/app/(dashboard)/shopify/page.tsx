"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderFilters } from "@/components/orders/order-filters";
import { Store, Link2, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ShopifyPage() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const tab = searchParams.get("tab");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [courier, setCourier] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [status, dateFrom, dateTo, courier]);

  async function fetchOrders() {
    setLoading(true);
    const params = new URLSearchParams({ platform: "shopify" });
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (courier) params.set("courier", courier);

    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  async function handleConnect() {
    const shopDomain = prompt("Ingresá el dominio de tu tienda Shopify (ej: mitienda.myshopify.com):");
    if (!shopDomain) return;

    const res = await fetch(`/api/auth/shopify?shop=${encodeURIComponent(shopDomain)}`);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function handleExport(orderIds: string[]) {
    setExporting(true);
    try {
      const res = await fetch("/api/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rotulos-shopify-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Error al exportar");
      }
    } finally {
      setExporting(false);
    }
  }

  if (tab === "connect" || (orders.length === 0 && !loading)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Shopify</h1>

        {connected && (
          <div className="flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green/5 p-4">
            <CheckCircle className="h-5 w-5 text-brand-green" />
            <p className="text-sm text-brand-green">¡Tienda conectada exitosamente!</p>
          </div>
        )}

        <Card className="text-center py-12">
          <Store className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Conectá tu tienda de Shopify
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Conecta tu tienda para sincronizar pedidos automáticamente y generar
            rótulos de envío.
          </p>
          <Button onClick={handleConnect} size="lg">
            <Link2 className="h-5 w-5" />
            Conectar Shopify
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Pedidos Shopify
      </h1>

      <OrderFilters
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        courier={courier}
        onStatusChange={setStatus}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onCourierChange={setCourier}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
        </div>
      ) : (
        <OrdersTable
          orders={orders}
          onExport={handleExport}
          exporting={exporting}
        />
      )}
    </div>
  );
}
