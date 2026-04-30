"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Coins, TrendingUp, TrendingDown, CheckCircle,
  XCircle, Clock, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function fmt(n: number) { return n.toLocaleString("es-AR"); }
function ars(n: number) { return `$${fmt(Math.round(n))}`; }

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:    { label: "Activo",    cls: "text-neon-green  bg-neon-green/10  border-neon-green/20" },
  inactive:  { label: "Inactivo",  cls: "text-yellow-400  bg-yellow-400/10  border-yellow-400/20" },
  suspended: { label: "Suspendido",cls: "text-neon-red    bg-neon-red/10    border-neon-red/20" },
};

const PURCHASE_STATUS: Record<string, string> = {
  approved: "text-neon-green",
  pending:  "text-yellow-400",
  rejected: "text-neon-red",
  cancelled:"text-[var(--text-secondary)]",
};

export default function ClientDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [client, setClient]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Credit adjustment modal state
  const [showAdj, setShowAdj]   = useState(false);
  const [adjDelta, setAdjDelta] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError]   = useState("");

  // Status change state
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/superadmin/clients/${id}`)
      .then((r) => r.json())
      .then((d) => { setClient(d.client); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true);
    const res  = await fetch(`/api/superadmin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.ok) setClient((c: any) => ({ ...c, status: newStatus }));
    setStatusLoading(false);
  }

  async function handleAdjustment() {
    setAdjError("");
    const delta = parseFloat(adjDelta);
    if (isNaN(delta) || delta === 0) { setAdjError("Ingresá un valor válido distinto de cero."); return; }
    if (!adjReason.trim())           { setAdjError("El motivo es obligatorio."); return; }

    setAdjLoading(true);
    const res  = await fetch(`/api/superadmin/clients/${id}/credits-adjustment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, reason: adjReason }),
    });
    const data = await res.json();
    if (data.ok) {
      setClient((c: any) => ({ ...c, credits: data.newBalance }));
      setShowAdj(false);
      setAdjDelta("");
      setAdjReason("");
    } else {
      setAdjError(data.error ?? "Error al ajustar créditos");
    }
    setAdjLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-brand-surface" />
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-brand-surface" />)}
        </div>
      </div>
    );
  }

  if (!client) return (
    <div className="text-center py-20">
      <p className="text-[var(--text-secondary)]">Cliente no encontrado</p>
      <Link href="/superadmin/clients" className="text-neon-purple text-sm mt-2 block">← Volver</Link>
    </div>
  );

  const totalSpent    = client.creditPurchase.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + p.amount, 0);
  const creditsBought = client.creditPurchase.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + p.credits, 0);
  const creditsUsed   = client.transaction.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + t.amount, 0);
  const st            = STATUS_LABELS[client.status] ?? STATUS_LABELS.active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/clients" className="p-2 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:border-neon-purple/30 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{client.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{client.email}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>{st.label}</span>
        </div>
        <div className="flex gap-2">
          {client.status !== "active" && (
            <Button variant="secondary" onClick={() => handleStatusChange("active")} disabled={statusLoading}>
              Activar
            </Button>
          )}
          {client.status !== "suspended" && (
            <Button variant="danger" onClick={() => handleStatusChange("suspended")} disabled={statusLoading}>
              Suspender
            </Button>
          )}
          <Button onClick={() => setShowAdj(true)}>
            <Coins className="h-4 w-4" />
            Ajustar créditos
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Créditos actuales", value: fmt(client.credits), icon: Coins,       color: "text-neon-cyan" },
          { label: "Total gastado",     value: ars(totalSpent),     icon: TrendingUp,   color: "text-neon-green" },
          { label: "Créditos comprados",value: fmt(creditsBought),  icon: ArrowUpCircle,color: "text-neon-cyan" },
          { label: "Créditos usados",   value: fmt(creditsUsed),    icon: TrendingDown, color: "text-neon-red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <p className="text-xs text-[var(--text-secondary)]">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Purchases + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchases */}
        <div className="rounded-xl border border-brand-border bg-brand-surface">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Últimas compras</h2>
          </div>
          <div className="divide-y divide-brand-border max-h-64 overflow-y-auto">
            {client.creditPurchase.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--text-secondary)] text-center">Sin compras</p>
            ) : client.creditPurchase.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{p.packageName ?? "—"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(p.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neon-cyan">+{p.credits} cr.</p>
                  <p className={`text-xs font-medium ${PURCHASE_STATUS[p.status]}`}>{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-xl border border-brand-border bg-brand-surface">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Historial de movimientos</h2>
          </div>
          <div className="divide-y divide-brand-border max-h-64 overflow-y-auto">
            {client.transaction.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--text-secondary)] text-center">Sin movimientos</p>
            ) : client.transaction.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                {t.type === "credit"
                  ? <ArrowUpCircle className="h-4 w-4 text-neon-green shrink-0" />
                  : <ArrowDownCircle className="h-4 w-4 text-neon-red shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] truncate">{t.description}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(t.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${t.type === "credit" ? "text-neon-green" : "text-neon-red"}`}>
                  {t.type === "credit" ? "+" : "-"}{t.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit adjustment modal */}
      {showAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-bg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Ajuste manual de créditos</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Cliente: <strong className="text-[var(--text-primary)]">{client.name}</strong> · Saldo actual: <strong className="text-neon-cyan">{fmt(client.credits)}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                  Cantidad (positivo para agregar, negativo para quitar)
                </label>
                <input
                  type="number"
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                  placeholder="Ej: 50 o -20"
                  className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                />
                {adjDelta && !isNaN(parseFloat(adjDelta)) && (
                  <p className="text-xs mt-1 text-[var(--text-secondary)]">
                    Nuevo saldo: <strong className="text-neon-cyan">{fmt(client.credits + parseFloat(adjDelta))}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Motivo (obligatorio)</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ej: Compensación por error técnico"
                  className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                />
              </div>
              {adjError && (
                <div className="flex items-center gap-2 rounded-lg bg-neon-red/10 border border-neon-red/20 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-neon-red shrink-0" />
                  <p className="text-xs text-neon-red">{adjError}</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowAdj(false); setAdjError(""); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleAdjustment} disabled={adjLoading}>
                  {adjLoading ? "Guardando..." : "Confirmar ajuste"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
