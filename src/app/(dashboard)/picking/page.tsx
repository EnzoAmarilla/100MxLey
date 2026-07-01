"use client";

import { useState, useEffect, useCallback } from "react";
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

function OrderCard({ order }: { order: PickingOrder }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-surface/50 transition-colors"
      >
        {open
          ? <ChevronDown className="h-4 w-4 text-neon-cyan shrink-0" />
          : <ChevronRight className="h-4 w-4 text-neon-cyan shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-neon-cyan">#{order.orderNumber}</span>
            <span className="text-sm text-[var(--text-primary)] truncate">{order.buyerName}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-[var(--text-secondary)]">{fmtDate(order.createdAt)}</span>
            {order.trackingCode && (
              <span className="text-xs font-mono text-[var(--text-secondary)] opacity-60">{order.trackingCode}</span>
            )}
            <span className="text-xs text-[var(--text-secondary)]">
              {order.products.reduce((s, p) => s + p.quantity, 0)} unidad{order.products.reduce((s, p) => s + p.quantity, 0) !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-brand-border">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest pt-2 mb-1">
            Productos a preparar
          </p>
          {order.products.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] italic py-2">Sin productos registrados</p>
          ) : order.products.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-brand-surface border border-brand-border">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-bold text-sm">
                {p.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] font-medium">{p.name}</p>
                {p.sku && <p className="text-xs text-[var(--text-secondary)] font-mono">SKU: {p.sku}</p>}
                {p.variantValues.length > 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.variantValues.join(" · ")}</p>
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
  const [orders,  setOrders]  = useState<PickingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/orders/picking-queue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar");
      setOrders(data.orders ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-neon-cyan" />
            Preparación / Picking
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Pedidos listos para armar. Aparecen aquí después de cargar las etiquetas de Andreani.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-brand-surface text-sm transition-all shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-neon-red/5 border border-neon-red/20 px-4 py-3 text-sm text-neon-red">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-neon-cyan/50" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-[var(--text-secondary)] opacity-30" />
          <p className="text-sm text-[var(--text-secondary)]">No hay pedidos pendientes de preparación.</p>
          <p className="text-xs text-[var(--text-secondary)] opacity-60">
            Aparecerán aquí después de cargar las etiquetas en "Etiquetas Andreani".
          </p>
        </div>
      )}

      {/* Summary */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 text-sm text-neon-cyan font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {orders.length} pedido{orders.length !== 1 ? "s" : ""} listo{orders.length !== 1 ? "s" : ""} para preparar
        </div>
      )}

      {/* Order cards */}
      {!loading && orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
