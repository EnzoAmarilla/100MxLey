"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Plus, Package, MapPin, Calendar, Clock, Lock } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente:    { label: "Pendiente",    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  en_revision:  { label: "En revisión",  color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  coordinada:   { label: "Coordinada",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  en_camino:    { label: "En camino",    color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  realizada:    { label: "Realizada",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  cancelada:    { label: "Cancelada",    color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

const SHIPPING_LABELS: Record<string, string> = {
  andreani:         "Andreani",
  correo_argentino: "Correo Argentino",
  uber_moto:        "Uber / Moto",
  otro:             "Otro",
};

const SIZE_LABELS: Record<string, string> = {
  pequeño: "Pequeño",
  mediano: "Mediano",
  grande:  "Grande",
  mixto:   "Mixto",
};

interface HistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string | null;
  clientNote: string | null;
  createdAt: string;
}

interface PickupRequest {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  packageCount: number;
  packageSize: string;
  preferredDate: string;
  preferredTimeSlot: string;
  shippingType: string;
  observations: string | null;
  status: string;
  createdAt: string;
  history: HistoryEntry[];
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function MisColectasPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/client/access")
      .then((r) => r.json())
      .then((d) => setHasAccess(d.logisticsEnabled ?? false))
      .catch(() => setHasAccess(false));
  }, []);

  useEffect(() => {
    if (hasAccess !== true) return;
    fetch("/api/client/pickup-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hasAccess]);

  if (hasAccess === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-brand-card border border-brand-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-[var(--text-secondary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Acceso pendiente de habilitación</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
          Esta sección será habilitada por el equipo de 100Mxley cuando tu cuenta esté lista para operar con logística.
        </p>
        <a
          href="mailto:soporte@100mxley.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all"
        >
          Solicitar habilitación
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-5 w-5 text-neon-cyan" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mis colectas</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Seguí el estado de tus solicitudes de retiro.</p>
        </div>
        <Link
          href="/colecta"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva colecta
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-brand-card border border-brand-border animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-card p-12 text-center">
          <Truck className="h-10 w-10 text-neon-cyan/30 mx-auto mb-4" />
          <p className="text-base font-semibold text-[var(--text-primary)] mb-2">Sin solicitudes aún</p>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Cuando solicites una colecta, la vas a ver acá.
          </p>
          <Link
            href="/colecta"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Solicitar colecta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-brand-border bg-brand-card shadow-card overflow-hidden">
              {/* Card header */}
              <button
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-brand-surface/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-neon-cyan/5 border border-neon-cyan/15 flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5 text-neon-cyan/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {req.address}, {req.city}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {req.packageCount} paquetes · {SIZE_LABELS[req.packageSize] ?? req.packageSize}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {req.preferredDate}
                    </span>
                    <span>{SHIPPING_LABELS[req.shippingType] ?? req.shippingType}</span>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-secondary)] shrink-0">
                  {new Date(req.createdAt).toLocaleDateString("es-AR")}
                </span>
              </button>

              {/* Expanded detail */}
              {expanded === req.id && (
                <div className="border-t border-brand-border px-5 py-4 space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Dirección completa", value: `${req.address}, ${req.city}, ${req.province} (${req.postalCode})` },
                      { label: "Franja horaria", value: req.preferredTimeSlot === "horario_completo" ? "Horario completo" : req.preferredTimeSlot === "mañana" ? "Mañana (8-13h)" : "Tarde (13-20h)" },
                      { label: "Tipo de envío", value: SHIPPING_LABELS[req.shippingType] ?? req.shippingType },
                      { label: "Tamaño", value: SIZE_LABELS[req.packageSize] ?? req.packageSize },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-brand-surface px-3.5 py-2.5">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-[var(--text-primary)]">{value}</p>
                      </div>
                    ))}
                  </div>

                  {req.observations && (
                    <div className="rounded-lg bg-brand-surface px-3.5 py-2.5">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Observaciones</p>
                      <p className="text-sm text-[var(--text-primary)]">{req.observations}</p>
                    </div>
                  )}

                  {/* History visible to client */}
                  {req.history.filter((h) => h.clientNote || h.newStatus).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Historial</p>
                      <div className="space-y-2">
                        {req.history.filter((h) => h.clientNote || h.newStatus).map((h) => (
                          <div key={h.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-2 w-2 rounded-full bg-neon-cyan/60 mt-1.5 shrink-0" />
                              <div className="w-px flex-1 bg-brand-border mt-1" />
                            </div>
                            <div className="pb-3">
                              {h.newStatus && (
                                <p className="text-xs font-medium text-[var(--text-primary)]">
                                  Estado: <StatusBadge status={h.newStatus} />
                                </p>
                              )}
                              {h.clientNote && (
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{h.clientNote}</p>
                              )}
                              <p className="text-[10px] text-[var(--text-secondary)]/60 mt-0.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(h.createdAt).toLocaleString("es-AR")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
