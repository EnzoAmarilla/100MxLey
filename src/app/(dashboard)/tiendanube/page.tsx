"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderFilters } from "@/components/orders/order-filters";
import { ShoppingBag, Link2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Skeleton row for table loading
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border flex items-center gap-4">
        <div className="h-4 w-24 rounded bg-brand-surface animate-pulse" />
        <div className="ml-auto h-8 w-36 rounded-lg bg-brand-surface animate-pulse" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface">
            {[10, 20, 28, 32, 16, 14, 18].map((w, i) => (
              <th key={i} className="px-5 py-3">
                <div className={`h-3 w-${w} rounded bg-brand-bg animate-pulse`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-brand-border">
              <td className="px-5 py-3.5"><div className="h-3 w-4 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-20 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-32 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-24 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-16 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-5 w-16 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-20 rounded bg-brand-surface animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TiendanubePage() {
  const searchParams = useSearchParams();
  const connected    = searchParams.get("connected");
  const tab          = searchParams.get("tab");

  const [orders, setOrders]     = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [hasOrders, setHasOrders] = useState<boolean | null>(null); // null = unknown yet

  const [status, setStatus]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [courier, setCourier]   = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchOrders = useCallback(async (p = 0) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    const params = new URLSearchParams({ platform: "tiendanube", page: String(p) });
    if (status)   params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo", dateTo);
    if (courier)  params.set("courier", courier);

    try {
      const res  = await fetch(`/api/orders?${params}`, { signal: abortRef.current.signal });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
      if (hasOrders === null) setHasOrders((data.total ?? 0) > 0);
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo, courier, hasOrders]);

  // Reset page and refetch when filters change
  useEffect(() => {
    fetchOrders(0);
  }, [status, dateFrom, dateTo, courier]);

  async function handleConnect() {
    const res  = await fetch("/api/auth/tiendanube");
    const data = await res.json();
    if (data.url) window.location.href = data.url;
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
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `rotulos-tiendanube-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        fetchOrders(page);
      } else {
        const err = await res.json();
        alert(err.error || "Error al exportar");
      }
    } finally {
      setExporting(false);
    }
  }

  const pageSize  = 50;
  const totalPages = Math.ceil(total / pageSize);

  // Show connect screen only once we know there are no orders (avoids flash)
  if (!loading && hasOrders === false && tab !== "connect") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tiendanube</h1>
        {connected && (
          <div className="flex items-center gap-2 rounded-xl border border-neon-green/30 bg-neon-green/5 p-4">
            <CheckCircle className="h-5 w-5 text-neon-green" />
            <p className="text-sm text-neon-green">¡Tienda conectada exitosamente!</p>
          </div>
        )}
        <Card className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Conectá tu tienda de Tiendanube</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Conecta tu tienda para sincronizar pedidos automáticamente y generar rótulos de envío.
          </p>
          <Button onClick={handleConnect} size="lg">
            <Link2 className="h-5 w-5" />
            Conectar Tiendanube
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pedidos Tiendanube</h1>
          {!loading && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {total} pedido{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <OrderFilters
        status={status} dateFrom={dateFrom} dateTo={dateTo} courier={courier}
        onStatusChange={setStatus} onDateFromChange={setDateFrom}
        onDateToChange={setDateTo} onCourierChange={setCourier}
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          <OrdersTable orders={orders} onExport={handleExport} exporting={exporting} />

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--text-secondary)]">
                Página {page + 1} de {totalPages} · {total} pedidos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary" size="sm"
                  disabled={page === 0}
                  onClick={() => fetchOrders(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </Button>
                <Button
                  variant="secondary" size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchOrders(page + 1)}
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
