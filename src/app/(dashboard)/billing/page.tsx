"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle,
  Download,
  Zap,
  Calendar,
  RefreshCw,
  Package,
  Star,
  TrendingUp,
} from "lucide-react";

const plan = {
  name: "Sin plan activo",
  price: 0,
  cycle: "-",
  status: "inactive",
  startDate: "-",
  nextBilling: "-",
  daysLeft: 0,
};

const features = [
  "Exportación ilimitada de rótulos",
  "Sincronización automática Tiendanube",
  "Sincronización automática Shopify",
  "Seguimiento de envíos en tiempo real",
  "Soporte prioritario por WhatsApp",
  "Historial de 12 meses",
];

const invoices: any[] = [];

const usageStats = [
  { label: "Rótulos exportados", value: 0, max: 10, unit: "" },
  { label: "Seguimientos activos", value: 0, max: 10, unit: "" },
  { label: "Tiendas conectadas", value: 0, max: 1, unit: "" },
  { label: "Créditos usados este mes", value: 0, max: 100, unit: "" },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Facturación</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-widest uppercase">Gestión de plan y pagos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Card */}
        <div className="lg:col-span-2 relative rounded-xl border border-neon-cyan/25 bg-brand-card p-6 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-neon-cyan/[0.03] blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-neon-yellow fill-neon-yellow drop-shadow-[0_0_6px_#FFB700]" />
                <span className="text-xs font-medium tracking-widest uppercase text-neon-yellow">Plan activo</span>
              </div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">{plan.name}</h2>
              <p className="text-neon-cyan font-mono text-2xl font-bold mt-1">
                ${plan.price.toLocaleString("es-AR")}
                <span className="text-sm font-normal text-[var(--text-secondary)]">/{plan.cycle}</span>
              </p>
            </div>
            <Badge variant="green">Activo</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-brand-surface border border-brand-border p-3">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Inicio del plan</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{plan.startDate}</p>
            </div>
            <div className="rounded-lg bg-brand-surface border border-neon-yellow/20 p-3">
              <div className="flex items-center gap-2 text-neon-yellow mb-1">
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="text-xs">Próximo cobro</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {plan.nextBilling}
                <span className="text-xs text-neon-yellow ml-2">({plan.daysLeft}d)</span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] mb-3">Incluye</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-neon-green shrink-0" />
                  <span className="text-xs text-[var(--text-secondary)]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm">
              <TrendingUp className="h-3.5 w-3.5" />
              Cambiar plan
            </Button>
            <Button variant="ghost" size="sm" className="text-neon-red hover:bg-neon-red/10 hover:text-neon-red border-transparent">
              Cancelar suscripción
            </Button>
          </div>
        </div>

        {/* Payment method + usage */}
        <div className="space-y-4">
          {/* Payment method */}
          <div className="relative rounded-xl border border-brand-border bg-brand-card p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent rounded-t-xl" />
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] mb-4">Método de pago</p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-surface border border-brand-border mb-3">
              <div className="h-8 w-12 rounded bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-neon-cyan" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Visa •••• 4242</p>
                <p className="text-xs text-[var(--text-secondary)]">Vence 08/27</p>
              </div>
              <Badge variant="cyan" className="ml-auto">Principal</Badge>
            </div>
            <Button variant="secondary" size="sm" className="w-full">
              Cambiar tarjeta
            </Button>
          </div>

          {/* Usage */}
          <div className="relative rounded-xl border border-brand-border bg-brand-card p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent rounded-t-xl" />
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] mb-4">Uso este mes</p>
            <div className="space-y-3">
              {usageStats.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">{s.label}</span>
                    <span className="text-neon-cyan font-mono">{s.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-green"
                      style={{ width: `${Math.min((s.value / s.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="relative rounded-xl border border-brand-border bg-brand-card overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
        <div className="px-6 py-4 border-b border-brand-border">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Historial de facturas</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              {["Factura", "Fecha", "Monto", "Método", "Estado", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-secondary)] italic">
                  No hay facturas disponibles aún.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-brand-border hover:bg-brand-surface transition-colors">
                  <td className="px-5 py-3 font-mono text-neon-cyan/80 text-xs">{inv.id}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)] text-xs">{inv.date}</td>
                  <td className="px-5 py-3 font-mono font-bold text-[var(--text-primary)]">
                    ${inv.amount.toLocaleString("es-AR")}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)] text-xs">{inv.method}</td>
                  <td className="px-5 py-3"><Badge variant="green">Pagada</Badge></td>
                  <td className="px-5 py-3">
                    <button className="flex items-center gap-1 text-xs text-neon-cyan/60 hover:text-neon-cyan transition-colors">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
