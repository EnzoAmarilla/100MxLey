"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { Zap, ShoppingBag, Store, AlertCircle, CheckCircle, RefreshCcw, Loader2 } from "lucide-react";

function formatARS(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(".", ",")}M`;
  if (value >= 1_000)     return `$${Math.round(value / 1_000).toLocaleString("es-AR")}K`;
  return `$${value}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [credits, setCredits]   = useState(0);
  const [consumed, setConsumed] = useState(0);

  const [tnConnected, setTnConnected] = useState(false);
  const [tnStoreName, setTnStoreName] = useState("");
  const [tnIngresos, setTnIngresos]   = useState(0);
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState("");

  const [readyToShip, setReadyToShip] = useState(0);
  const [inTransit, setInTransit]     = useState(0);
  const [delivered, setDelivered]     = useState(0);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        setCredits(data.credits ?? 0);
        const total = (data.transactions ?? [])
          .filter((t: any) => t.type === "debit")
          .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        setConsumed(total);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.tiendanube) {
          setTnConnected(true);
          setTnStoreName(data.tiendanube.storeName || "");
        }
      })
      .catch(() => {});
  }, []);

  const fetchMetrics = useCallback(() => {
    fetch("/api/metrics?platform=tiendanube")
      .then((r) => r.json())
      .then((data) => {
        setTnIngresos(data.totalRevenue ?? 0);
        const sc = data.statusCounts ?? {};
        setReadyToShip(sc.paid ?? 0);
        setInTransit(sc.shipped ?? 0);
        setDelivered(sc.delivered ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!tnConnected) return;
    fetchMetrics();
  }, [tnConnected, fetchMetrics]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/integrations/tiendanube/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`✓ ${data.count} pedidos sincronizados`);
        fetchMetrics();
      } else {
        setSyncMsg("Error al sincronizar. Intentá de nuevo.");
      }
    } catch {
      setSyncMsg("Error al sincronizar. Intentá de nuevo.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-neon-cyan drop-shadow-[0_0_8px_#00F5FF]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Hola,{" "}
              <span className="text-neon-cyan" style={{ textShadow: "0 0 12px rgba(0,245,255,0.4)" }}>
                {session?.user?.name || "Usuario"}
              </span>
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] tracking-widest uppercase">Panel de control · 100Mxley</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border">
          <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-[var(--text-secondary)]">Sistema activo</span>
        </div>
      </div>

      {/* Banners de estado Tiendanube */}
      {tnConnected && tnIngresos > 0 && (
        <div className="relative flex items-center gap-3 rounded-xl border border-neon-green/25 bg-neon-green/[0.04] px-4 py-3 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent" />
          <CheckCircle className="h-4 w-4 text-neon-green shrink-0 drop-shadow-[0_0_6px_#00FF88]" />
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="text-neon-green font-medium">{tnStoreName || "Tiendanube"}</span>
            {" "}conectada · mostrando datos de los últimos 30 días
          </p>
        </div>
      )}
      {tnConnected && tnIngresos === 0 && (
        <div className="relative flex items-center justify-between gap-3 rounded-xl border border-neon-yellow/25 bg-neon-yellow/[0.04] px-4 py-3 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-yellow/40 to-transparent" />
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-neon-yellow shrink-0" />
            <p className="text-xs text-[var(--text-secondary)]">
              {syncMsg || "Tiendanube conectada pero sin datos. Sincronizá tus pedidos para ver las métricas."}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-neon-yellow hover:underline disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            {syncing ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        </div>
      )}

      {/* ── Métricas Tiendanube ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-neon-cyan" />
            <span className="text-xs font-semibold text-neon-cyan tracking-widest uppercase">Tiendanube</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/20 to-transparent" />
          {tnConnected ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-green" />
              <span className="text-[10px] text-neon-green">Conectada</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-surface border border-brand-border">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
              <span className="text-[10px] text-[var(--text-secondary)]">Sin conectar</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Ingresos tienda"
            value={formatARS(tnIngresos)}
            change={0}
          />
          <MetricCard
            label="MercadoPago (cobros)"
            value="$0"
            change={0}
          />
          <MetricCard
            label="Gastos (envíos + comisión)"
            value="$0"
            change={0}
          />
          <MetricCard
            label="Ganancia tienda"
            value="$0"
            change={0}
          />
        </div>
      </div>

      {/* ── Pedidos por estado ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Listos para despachar", value: readyToShip, color: "text-neon-yellow", glow: "via-neon-yellow/30", dot: "bg-neon-yellow" },
          { label: "En camino",             value: inTransit,   color: "text-neon-cyan",   glow: "via-neon-cyan/30",   dot: "bg-neon-cyan"   },
          { label: "Entregados",            value: delivered,   color: "text-neon-green",  glow: "via-neon-green/30",  dot: "bg-neon-green"  },
        ].map((c) => (
          <div key={c.label} className="relative rounded-xl border border-brand-border bg-brand-card p-5">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${c.glow} to-transparent rounded-t-xl`} />
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-2 w-2 rounded-full ${c.dot}`} />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{c.label}</p>
            </div>
            <p className={`text-3xl font-bold font-mono ${c.color}`}>{c.value}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">pedidos</p>
          </div>
        ))}
      </div>

      {/* ── Métricas Shopify ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-neon-purple" />
            <span className="text-xs font-semibold text-neon-purple tracking-widest uppercase">Shopify</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-neon-purple/20 to-transparent" />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-surface border border-brand-border">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
            <span className="text-[10px] text-[var(--text-secondary)]">Sin conectar</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="MercadoLibre (ventas)" value="$0" locked />
          <MetricCard label="Ingresos netos"         value="$0" locked />
          <MetricCard label="Costos"                  value="$0" locked />
          <MetricCard label="Ganancia neta"           value="$0" locked />
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusCard
          label="Créditos disponibles"
          value={credits}
          linkText="Ver créditos"
          linkHref="/credits"
          color="text-neon-green"
        />
        <StatusCard
          label="Créditos consumidos"
          value={consumed}
          linkText="Ver detalle"
          linkHref="/credits"
          color="text-neon-yellow"
        />
        <StatusCard
          label="Plan de facturación"
          value="Plan Pro"
          linkText="Ver facturación"
          linkHref="/billing"
          color="text-neon-cyan"
        />
      </div>
    </div>
  );
}
