"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck, Package, CheckCircle, XCircle, AlertTriangle, Clock, Activity, Users, ChevronRight,
} from "lucide-react";
import { STATUS_LABELS, type OperationalStatus } from "@/lib/admin";
import { useAdminClient } from "@/contexts/admin-client";

const PERIODS = ["today", "7d", "30d", "all"] as const;
const PERIOD_LABELS: Record<string, string> = { today: "Hoy", "7d": "7 días", "30d": "30 días", all: "Todo" };

interface GlobalData  { mode: "global"; connectedClients: number; pendingTotal: number; incidenceTotal: number; logisticsActive: number; logisticsBlocked: number }
interface ClientData  {
  mode: "client";
  pendiente: number; en_preparacion: number; listo_para_despachar: number;
  enviado: number; en_camino: number; entregado: number; cancelado: number; incidencia: number;
  recentActivity: { id: string; orderId: string; orderExternalId: string; newStatus: string; changedAt: string; changedBy: string | null }[];
}
type DashData = GlobalData | ClientData;

function MetricCard({ label, value, icon: Icon, colorBorder, colorText }: { label: string; value: number; icon: React.ElementType; colorBorder: string; colorText: string }) {
  return (
    <div className={`rounded-xl border bg-white/[0.02] p-5 flex items-center gap-4 ${colorBorder}`}>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/5 shrink-0">
        <Icon className={`h-5 w-5 ${colorText}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { activeClient, hydrated } = useAdminClient();
  const [period, setPeriod]        = useState<string>("7d");
  const [data, setData]            = useState<DashData | null>(null);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (activeClient) params.set("clientId", activeClient.id);
    fetch(`/api/admin/dashboard?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, activeClient, hydrated]);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard operativo</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {activeClient ? `Métricas de ${activeClient.name}` : "Resumen global del sistema"}
          </p>
        </div>
        {activeClient && (
          <div className="flex gap-1.5 bg-white/5 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !activeClient ? (
        // ── Global view ────────────────────────────────────────────────────────
        data?.mode === "global" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Clientes conectados"    value={data.connectedClients} icon={Users}         colorBorder="border-amber-900/40" colorText="text-amber-400" />
              <MetricCard label="Pedidos pendientes"     value={data.pendingTotal}      icon={Clock}         colorBorder="border-zinc-700/50"  colorText="text-zinc-300" />
              <MetricCard label="Incidencias abiertas"   value={data.incidenceTotal}    icon={AlertTriangle} colorBorder="border-orange-900/40" colorText="text-orange-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Con logística activa"   value={data.logisticsActive}  icon={Truck}         colorBorder="border-cyan-900/40"  colorText="text-cyan-400" />
              <MetricCard label="Sin logística habilitada" value={data.logisticsBlocked} icon={Package}     colorBorder="border-zinc-700/50"  colorText="text-zinc-400" />
              <MetricCard label="Solicitudes pendientes" value={(data as any).logisticsRequests ?? 0} icon={Activity} colorBorder="border-amber-500/30" colorText="text-amber-500" />
            </div>

            {((data as any).logisticsRequests > 0 || data.logisticsBlocked > 0) && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">
                      {(data as any).logisticsRequests > 0 
                        ? `${(data as any).logisticsRequests} cliente(s) solicitaron habilitación`
                        : `${data.logisticsBlocked} cliente(s) sin logística habilitada`}
                    </p>
                    <p className="text-xs text-zinc-500">Revisá las solicitudes para habilitar nuevas secciones.</p>
                  </div>
                </div>
                <Link
                  href={(data as any).logisticsRequests > 0 ? "/admin/clients?logistics=requested" : "/admin/clients?logistics=blocked"}
                  className="shrink-0 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all"
                >
                  Ver solicitudes →
                </Link>
              </div>
            )}

            <div className="rounded-xl border border-amber-900/20 bg-amber-500/[0.03] p-8 text-center">
              <Users className="h-10 w-10 text-amber-500/50 mx-auto mb-4" />
              <p className="text-base font-semibold text-zinc-200 mb-2">Seleccioná un cliente para comenzar</p>
              <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
                Elegí un cliente para ver sus pedidos, inventario y logística en detalle.
              </p>
              <Link
                href="/admin/clients"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-all"
              >
                Ir a clientes <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">Cargando datos globales…</div>
        )
      ) : (
        // ── Client view ────────────────────────────────────────────────────────
        data?.mode === "client" ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Pendientes"            value={data.pendiente}            icon={Clock}         colorBorder="border-zinc-700/50"   colorText="text-zinc-300" />
              <MetricCard label="En preparación"        value={data.en_preparacion}       icon={Package}       colorBorder="border-amber-900/40"  colorText="text-amber-400" />
              <MetricCard label="Listos para despachar" value={data.listo_para_despachar} icon={Activity}      colorBorder="border-blue-900/40"   colorText="text-blue-400" />
              <MetricCard label="Enviados"              value={data.enviado}              icon={Truck}         colorBorder="border-cyan-900/40"   colorText="text-cyan-400" />
              <MetricCard label="En camino"             value={data.en_camino}            icon={Truck}         colorBorder="border-violet-900/40" colorText="text-violet-400" />
              <MetricCard label="Entregados"            value={data.entregado}            icon={CheckCircle}   colorBorder="border-emerald-900/40" colorText="text-emerald-400" />
              <MetricCard label="Cancelados"            value={data.cancelado}            icon={XCircle}       colorBorder="border-red-900/40"    colorText="text-red-400" />
              <MetricCard label="Incidencias"           value={data.incidencia}           icon={AlertTriangle} colorBorder="border-orange-900/40" colorText="text-orange-400" />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link href="/admin/orders"           className="px-4 py-2 rounded-lg bg-white/5 border border-zinc-700/50 text-sm text-zinc-300 hover:bg-white/10 hover:text-amber-400 transition-all">Ver pedidos →</Link>
              <Link href="/admin/client-inventory" className="px-4 py-2 rounded-lg bg-white/5 border border-zinc-700/50 text-sm text-zinc-300 hover:bg-white/10 hover:text-amber-400 transition-all">Ver inventario →</Link>
              <Link href="/admin/incidents"        className="px-4 py-2 rounded-lg bg-white/5 border border-zinc-700/50 text-sm text-zinc-300 hover:bg-white/10 hover:text-amber-400 transition-all">Ver incidencias →</Link>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-200">Últimos movimientos operativos</h2>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-8">Sin actividad reciente</p>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {data.recentActivity.map((act) => (
                    <div key={act.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">
                          {"Pedido "}
                          <Link href={`/admin/orders/${act.orderId}`} className="text-amber-400 font-mono text-xs hover:underline">
                            #{act.orderExternalId}
                          </Link>
                          {" → "}
                          <span className="font-medium">
                            {STATUS_LABELS[act.newStatus as OperationalStatus] ?? act.newStatus}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {act.changedBy ?? "Sistema"} · {new Date(act.changedAt).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">Cargando métricas del cliente…</div>
        )
      )}
    </div>
  );
}
