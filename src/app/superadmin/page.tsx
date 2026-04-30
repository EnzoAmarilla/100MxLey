"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, Coins, TrendingUp, TrendingDown, CreditCard,
  ShoppingBag, Clock, CheckCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

type Period = "today" | "7d" | "30d" | "this-month" | "prev-month";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Hoy",           value: "today" },
  { label: "7 días",        value: "7d" },
  { label: "30 días",       value: "30d" },
  { label: "Este mes",      value: "this-month" },
  { label: "Mes anterior",  value: "prev-month" },
];

function fmt(n: number) { return n.toLocaleString("es-AR"); }
function ars(n: number) { return `$${fmt(Math.round(n))}`; }

function MetricCard({
  label, value, sub, icon: Icon, color = "cyan", trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; trend?: number | null;
}) {
  const colors: Record<string, string> = {
    cyan:   "text-neon-cyan   border-neon-cyan/20   bg-neon-cyan/5",
    purple: "text-neon-purple border-neon-purple/20 bg-neon-purple/5",
    green:  "text-neon-green  border-neon-green/20  bg-neon-green/5",
    red:    "text-neon-red    border-neon-red/20    bg-neon-red/5",
    yellow: "text-yellow-400  border-yellow-400/20  bg-yellow-400/5",
  };
  const cls = colors[color] ?? colors.cyan;

  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{label}</p>
        <Icon className="h-4 w-4 opacity-60" />
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <p className="text-xs text-[var(--text-secondary)]">{sub}</p>}
        {trend !== null && trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-neon-green" : "text-neon-red"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(Math.round(trend))}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [period, setPeriod]   = useState<Period>("this-month");
  const [data,   setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/superadmin/dashboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const m = data?.metrics ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Visión global del negocio</p>
        </div>
        {/* Period filter */}
        <div className="flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value
                  ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-brand-border bg-brand-surface h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Ingresos del período"
              value={ars(m.revenueThisMonth ?? 0)}
              sub={`anterior: ${ars(m.revenuePrevMonth ?? 0)}`}
              icon={TrendingUp}
              color="green"
              trend={m.revenueGrowth}
            />
            <MetricCard
              label="Créditos vendidos"
              value={fmt(m.creditsSold ?? 0)}
              sub="en el período"
              icon={Coins}
              color="cyan"
            />
            <MetricCard
              label="Créditos consumidos"
              value={fmt(m.creditsConsumed ?? 0)}
              sub="en el período"
              icon={TrendingDown}
              color="purple"
            />
            <MetricCard
              label="Ticket promedio"
              value={ars(m.avgTicket ?? 0)}
              sub={`${m.approvedPayments ?? 0} pagos aprobados`}
              icon={CreditCard}
              color="yellow"
            />
            <MetricCard
              label="Clientes totales"
              value={fmt(m.totalClients ?? 0)}
              sub={`+${m.newClients ?? 0} nuevos`}
              icon={Users}
              color="cyan"
            />
            <MetricCard
              label="Créditos disponibles"
              value={fmt(m.creditsAvailableTotal ?? 0)}
              sub="en todas las cuentas"
              icon={Coins}
              color="green"
            />
            <MetricCard
              label="Pagos pendientes"
              value={fmt(m.pendingPayments ?? 0)}
              sub="sin confirmar"
              icon={Clock}
              color={m.pendingPayments > 0 ? "yellow" : "cyan"}
            />
            <MetricCard
              label="Pedidos del período"
              value={fmt(m.ordersThisPeriod ?? 0)}
              sub={`${fmt(m.totalOrders ?? 0)} total histórico`}
              icon={ShoppingBag}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue chart */}
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Ingresos por día</h2>
              {(data?.revenueChart?.length ?? 0) === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin datos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00FF88" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "#0f1117", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, "Ingreso"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#00FF88" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Credits bar chart */}
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Créditos vendidos vs consumidos por día</h2>
              {(data?.revenueChart?.length ?? 0) === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin datos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{ background: "#0f1117", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="credits" name="Vendidos"  fill="#00F5FF" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top clients */}
          {(data?.topClients?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top 10 clientes por facturación</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      {["#", "Cliente", "Email", "Gastado", "Créditos comprados", "Créditos usados", "Saldo"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs text-[var(--text-secondary)] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topClients.map((c: any, i: number) => (
                      <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-bg transition-colors">
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{c.name}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs">{c.email}</td>
                        <td className="px-3 py-2.5 text-neon-green font-medium">{ars(c.totalSpent)}</td>
                        <td className="px-3 py-2.5 text-neon-cyan">{fmt(c.creditsBought)}</td>
                        <td className="px-3 py-2.5 text-neon-red">{fmt(c.creditsUsed)}</td>
                        <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">{fmt(c.credits)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
