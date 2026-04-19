"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingCart,
  DollarSign,
  Truck,
  TrendingUp,
} from "lucide-react";

const COLORS = ["#2E86AB", "#F39C12", "#E74C3C", "#1E8449", "#9B59B6"];

export default function MetricsPage() {
  const [data, setData] = useState<any>(null);
  const [platform, setPlatform] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [platform, dateFrom, dateTo]);

  async function fetchMetrics() {
    setLoading(true);
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/metrics?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
      </div>
    );
  }

  const statusData = Object.entries(data.statusCounts || {}).map(
    ([name, value]) => ({ name, value })
  );

  const platformData = Object.entries(
    data.platformCounts || {}
  ).map(([name, val]: [string, any]) => ({
    name: name === "tiendanube" ? "Tiendanube" : "Shopify",
    pedidos: val.orders,
    ingresos: val.revenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Métricas
        </h1>
        <div className="flex gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">Todas las plataformas</option>
            <option value="tiendanube">Tiendanube</option>
            <option value="shopify">Shopify</option>
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-accent/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Total pedidos
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {data.totalOrders}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Ingresos brutos
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                ${data.totalRevenue.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-brand-yellow" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Costo envíos
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                $0
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Ganancia neta
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                ${data.totalRevenue.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Ventas por día (últimos 30 días)
        </h2>
        {data.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey="total" fill="#2E86AB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-[var(--text-secondary)] py-8">
            Sin datos para el período seleccionado
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Productos más vendidos
          </h2>
          {data.topProducts.length > 0 ? (
            <div className="space-y-2">
              {data.topProducts.map((p: any, i: number) => (
                <div
                  key={p.sku}
                  className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-[var(--text-secondary)]">
                      #{i + 1}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {p.sku}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-brand-accent">
                    {p.quantity} uds.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-secondary)] py-8">
              Sin datos
            </p>
          )}
        </Card>

        {/* Status breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Pedidos por estado
          </h2>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-[var(--text-secondary)] py-8">
              Sin datos
            </p>
          )}
        </Card>
      </div>

      {/* Platform comparison */}
      {platformData.length > 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Comparativa entre plataformas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {platformData.map((p: any) => (
              <div
                key={p.name}
                className="text-center p-4 rounded-lg bg-[var(--bg-secondary)]"
              >
                <p className="font-semibold text-[var(--text-primary)]">
                  {p.name}
                </p>
                <p className="text-2xl font-bold text-brand-accent mt-2">
                  {p.pedidos} pedidos
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  ${p.ingresos.toLocaleString("es-AR")} en ingresos
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
