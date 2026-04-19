"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { Lock, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const [consumed, setConsumed] = useState(0);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        setCredits(data.credits ?? 0);
        const totalDebit = (data.transactions ?? [])
          .filter((t: any) => t.type === "debit")
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        setConsumed(totalDebit);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Bienvenido, {session?.user?.name || "Usuario"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Panel de control de 100Mxley
        </p>
      </div>

      {/* Banner de aviso */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-yellow/30 bg-brand-yellow/5 p-4">
        <AlertTriangle className="h-5 w-5 text-brand-yellow mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            Algunas funciones están en construcción
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Las métricas avanzadas estarán disponibles una vez que conectes tus tiendas.
            Mientras tanto, podés empezar a gestionar tus envíos.
          </p>
        </div>
      </div>

      {/* Métricas Tiendanube */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Tiendanube
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Ingresos tienda" value="$0" locked />
          <MetricCard label="MercadoPago (cobros)" value="$0" locked />
          <MetricCard label="Gastos tienda" value="$0" locked />
          <MetricCard label="Ganancia tienda" value="$0" locked />
        </div>
      </div>

      {/* Métricas Shopify */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Shopify
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="MercadoLibre (ventas)" value="$0" locked />
          <MetricCard label="Ingresos netos" value="$0" locked />
          <MetricCard label="Costos" value="$0" locked />
          <MetricCard label="Ganancia neta" value="$0" locked />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusCard
          label="Créditos disponibles"
          value={credits}
          linkText="Ver créditos"
          linkHref="/credits"
          color="text-brand-green"
        />
        <StatusCard
          label="Créditos consumidos"
          value={consumed}
          linkText="Ver detalle"
          linkHref="/credits"
          color="text-brand-yellow"
        />
        <StatusCard
          label="Plan de facturación"
          value="Sin plan"
          linkText="Ver facturación"
          linkHref="/billing"
          color="text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}
