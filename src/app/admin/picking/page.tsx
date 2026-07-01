"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminClient } from "@/contexts/admin-client";
import {
  ScanLine, Package, ChevronDown, ChevronRight,
  CheckCircle2, Loader2, RefreshCw, AlertCircle,
} from "lucide-react";

interface Product {
  name:          string;
  sku:           string;
  quantity:      number;
  variantValues: string[];
}

interface PickingOrder {
  id:           string;
  orderNumber:  string | number;
  buyerName:    string;
  buyerEmail:   string;
  trackingCode: string | null;
  createdAt:    string;
  products:     Product[];
}

const pad = (n: number) => String(n).padStart(2, "0");
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function OrderCard({
  order,
  onComplete,
  completing,
}: {
  order:      PickingOrder;
  onComplete: (id: string) => void;
  completing: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-amber-900/30 bg-[#181510] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        {open
          ? <ChevronDown className="h-4 w-4 text-amber-400 shrink-0" />
          : <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-amber-400">#{order.orderNumber}</span>
            <span className="text-sm text-zinc-200 truncate">{order.buyerName}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-500">{fmtDate(order.createdAt)}</span>
            {order.trackingCode && (
              <span className="text-xs font-mono text-zinc-600">{order.trackingCode}</span>
            )}
            <span className="text-xs text-zinc-500">
              {order.products.reduce((s, p) => s + p.quantity, 0)} unidad{order.products.reduce((s, p) => s + p.quantity, 0) !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(order.id); }}
          disabled={completing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-all shrink-0"
        >
          {completing
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <CheckCircle2 className="h-3.5 w-3.5" />}
          Listo
        </button>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-amber-900/20">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest pt-2 mb-1">
            Productos a preparar
          </p>
          {order.products.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">Sin productos registrados</p>
          ) : order.products.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.05]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
                {p.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-100 font-medium">{p.name}</p>
                {p.sku && <p className="text-xs text-zinc-500 font-mono">SKU: {p.sku}</p>}
                {p.variantValues.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-0.5">{p.variantValues.join(" · ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PickingPage() {
  const { activeClient, hydrated } = useAdminClient();
  const [orders,     setOrders]     = useState<PickingOrder[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/orders/picking-queue?clientId=${activeClient.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar");
      setOrders(data.orders ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleComplete = async (orderId: string) => {
    setCompleting(orderId);
    try {
      await fetch("/api/admin/orders/picking-queue", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId }),
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch { /* silencioso */ }
    finally { setCompleting(null); }
  };

  if (!hydrated) return null;

  if (!activeClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <ScanLine className="h-12 w-12 text-amber-400/30" />
        <div>
          <p className="text-base font-semibold text-zinc-300">Seleccioná un cliente</p>
          <p className="text-sm text-zinc-500 mt-1">
            Elegí un cliente en la barra superior para ver los pedidos pendientes de preparación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
            <ScanLine className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Preparación / Picking</h1>
            <p className="text-sm text-zinc-400">
              Pedidos listos para armar — etiquetas cargadas por el cliente
            </p>
          </div>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-900/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-sm transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400/50" />
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-400">No hay pedidos pendientes de preparación.</p>
          <p className="text-xs text-zinc-600">
            Aparecerán aquí cuando el cliente suba las etiquetas de Andreani.
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 font-medium">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""} pendiente{orders.length !== 1 ? "s" : ""} de preparación
        </div>
      )}

      {!loading && orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onComplete={handleComplete}
          completing={completing === order.id}
        />
      ))}
    </div>
  );
}
