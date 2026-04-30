"use client";

import { useEffect, useState } from "react";
import { Truck, Package, CheckCircle, XCircle, AlertTriangle, Clock, Users, Activity } from "lucide-react";
import { STATUS_LABELS, type OperationalStatus } from "@/lib/admin";

interface DashboardData {
  pendiente:            number;
  en_preparacion:       number;
  listo_para_despachar: number;
  enviado:              number;
  en_camino:            number;
  entregado:            number;
  cancelado:            number;
  incidencia:           number;
  activeClients:        number;
  recentActivity: {
    id: string;
    orderId: string;
    newStatus: string;
    changedAt: string;
    changedBy: string | null;
    clientName: string;
  }[];
}

const PERIODS = ["today", "7d", "30d", "all"] as const;
const PERIOD_LABELS: Record<string, string> = { today: "Hoy", "7d": "7 días", "30d": "30 días", all: "Todo" };

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className={`rounded-xl border bg-white/[0.02] p-5 flex items-center gap-4 ${color}`}>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/5 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<string>("7d");
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard operativo</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Centro de control logístico</p>
        </div>
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
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Status metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Pendientes"            value={data.pendiente}            icon={Clock}         color="border-zinc-700/50" />
            <MetricCard label="En preparación"        value={data.en_preparacion}       icon={Package}       color="border-amber-900/40" />
            <MetricCard label="Listos para despachar" value={data.listo_para_despachar} icon={Activity}      color="border-blue-900/40" />
            <MetricCard label="Enviados"               value={data.enviado}              icon={Truck}         color="border-cyan-900/40" />
            <MetricCard label="En camino"              value={data.en_camino}            icon={Truck}         color="border-violet-900/40" />
            <MetricCard label="Entregados"             value={data.entregado}            icon={CheckCircle}   color="border-emerald-900/40" />
            <MetricCard label="Cancelados"             value={data.cancelado}            icon={XCircle}       color="border-red-900/40" />
            <MetricCard label="Incidencias"            value={data.incidencia}           icon={AlertTriangle} color="border-orange-900/40" />
          </div>

          {/* Active clients */}
          <div className="rounded-xl border border-amber-900/30 bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.activeClients}</p>
              <p className="text-xs text-zinc-400">Clientes con pedidos en el período</p>
            </div>
          </div>

          {/* Recent activity */}
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
                        <span className="font-medium">{act.clientName}</span>
                        {" — pedido "}
                        <span className="text-amber-400 font-mono text-xs">{act.orderId.slice(0, 8)}</span>
                        {" → "}
                        <span className="font-medium">{STATUS_LABELS[act.newStatus as OperationalStatus] ?? act.newStatus}</span>
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
      ) : null}
    </div>
  );
}
