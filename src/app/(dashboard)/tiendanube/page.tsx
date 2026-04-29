"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderFilters } from "@/components/orders/order-filters";
import {
  ShoppingBag,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  Loader2,
  CreditCard,
  Truck,
  TrendingUp,
  Ban,
} from "lucide-react";

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
            {[10, 20, 20, 28, 16, 14, 20, 20, 10].map((w, i) => (
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
              <td className="px-5 py-3.5"><div className="h-3 w-20 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-32 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-16 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-12 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-5 w-16 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-5 w-20 rounded bg-brand-surface animate-pulse" /></td>
              <td className="px-5 py-3.5"><div className="h-3 w-8 rounded bg-brand-surface animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StatusCounts {
  pending: number;
  paid: number;
  ready_to_ship: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export default function TiendanubePage() {

  const [orders, setOrders]     = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncMsg, setSyncMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, paid: 0, ready_to_ship: 0, shipped: 0, delivered: 0, cancelled: 0, total: 0 });
  const [totalRevenue, setTotalRevenue]   = useState(0);
  const [totalShipping, setTotalShipping] = useState(0);
  const [netRevenue, setNetRevenue]       = useState(0);

  const [status, setStatus]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [courier, setCourier]   = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchOrders = useCallback(async (p = 0) => {
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
      const rows = data.orders ?? [];
      setOrders(rows);
      setTotal(data.total ?? 0);
      setPage(p);
      setTotalRevenue(data.totalRevenue   ?? 0);
      setTotalShipping(data.totalShipping ?? 0);
      setNetRevenue(data.netRevenue       ?? 0);
      const sc = data.statusCounts ?? {};
      const allTotal = Object.values(sc as Record<string, number>).reduce((a: number, b) => a + (b as number), 0);
      setCounts({
        pending:       sc.pending       ?? 0,
        paid:          sc.paid          ?? 0,
        ready_to_ship: sc.ready_to_ship ?? 0,
        shipped:       sc.shipped       ?? 0,
        delivered:     sc.delivered     ?? 0,
        cancelled:     sc.cancelled     ?? 0,
        total:         allTotal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo, courier]);

  useEffect(() => {
    fetchOrders(0);
  }, [status, dateFrom, dateTo, courier, fetchOrders]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res  = await fetch("/api/integrations/tiendanube/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const label = data.incremental ? "actualizados" : "procesados";
        setSyncMsg({ ok: true, text: `Sincronización completa: ${data.count} pedidos ${label}.` });
        fetchOrders(0);
        setTimeout(() => setSyncMsg(null), 7000);
      } else {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || "Error al sincronizar con Tiendanube.");
        setSyncMsg({ ok: false, text: msg });
      }
    } catch (error) {
      setSyncMsg({ ok: false, text: "Error de conexión. Intentá de nuevo." });
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-neon-cyan" />
            Pedidos Tiendanube
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestiona tus pedidos y genera rótulos de envío.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/5"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncMsg && (
        <div className={[
          "rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between",
          syncMsg.ok
            ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
            : "bg-neon-red/10 border border-neon-red/30 text-neon-red",
        ].join(" ")}>
          {syncMsg.text}
          <button onClick={() => setSyncMsg(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Estado de pedidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-cyan/10">
              <Package className="h-5 w-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{counts.total}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-red/10">
              <CreditCard className="h-5 w-5 text-neon-red" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Por cobrar</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{counts.pending}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-purple/10">
              <Clock className="h-5 w-5 text-neon-purple" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Por empaquetar</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{counts.paid}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-yellow/10">
              <Package className="h-5 w-5 text-neon-yellow" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Por enviar</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{counts.ready_to_ship}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-green/10">
              <CheckCircle2 className="h-5 w-5 text-neon-green" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Entregados</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{counts.delivered}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-surface">
              <Ban className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Cancelados</p>
              <p className="text-xl font-bold text-[var(--text-secondary)]">{counts.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-cyan/10">
              <CreditCard className="h-5 w-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Facturación (Período)</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">${totalRevenue.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-red/10">
              <Truck className="h-5 w-5 text-neon-red" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Gastos de Envío</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">${totalShipping.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </Card>
        <Card glow="none" className="p-4 bg-brand-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-green/10">
              <TrendingUp className="h-5 w-5 text-neon-green" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Ganancia Neta</p>
              <p className="text-xl font-bold text-neon-green">${netRevenue.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Listado de Pedidos</h2>
          <div className="text-xs text-[var(--text-secondary)]">
            Mostrando {orders.length} de {total}
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
              <div className="flex items-center justify-between px-1 pt-4">
                <p className="text-xs text-[var(--text-secondary)]">
                  Página {page + 1} de {totalPages} · {total} pedidos
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary" size="sm"
                    disabled={page === 0}
                    onClick={() => fetchOrders(page - 1)}
                    className="h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                  </Button>
                  <Button
                    variant="secondary" size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => fetchOrders(page + 1)}
                    className="h-8"
                  >
                    Siguiente <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
