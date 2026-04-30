"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Truck, CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, STATUS_CLIENT_MESSAGES, type OperationalStatus } from "@/lib/admin";

interface StatusHistory {
  id:         string;
  oldStatus:  string | null;
  newStatus:  string;
  clientNote: string | null;
  changedAt:  string;
}

interface ClientOrder {
  id:               string;
  externalId:       string;
  buyerName:        string;
  status:           string;
  operationalStatus: string | null;
  clientNote:       string | null;
  totalAmount:      number;
  trackingCode:     string | null;
  courier:          string | null;
  createdAt:        string;
  history:          StatusHistory[];
}

const STATUS_ICONS: Partial<Record<OperationalStatus, React.ElementType>> = {
  pendiente:              Clock,
  en_preparacion:         Package,
  listo_para_despachar:   Package,
  enviado:                Truck,
  en_camino:              Truck,
  entregado:              CheckCircle,
  cancelado:              XCircle,
  incidencia:             AlertTriangle,
};

export default function LogisticsPage() {
  const [orders, setOrders]   = useState<ClientOrder[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/orders?limit=50")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pedidos / Logística</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          {total > 0 ? `${total} pedidos registrados` : "Seguí el estado de tus pedidos en tiempo real"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-brand-surface animate-pulse border border-brand-border" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-12 text-center">
          <Package className="h-10 w-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--text-secondary)] text-sm">No tenés pedidos registrados aún.</p>
          <p className="text-[var(--text-secondary)] text-xs mt-1 opacity-60">
            Una vez que tengas pedidos, podrás seguir su estado acá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st    = order.operationalStatus as OperationalStatus | null;
            const Icon  = st ? (STATUS_ICONS[st] ?? Package) : Package;
            const isExp = expanded === order.id;

            return (
              <div key={order.id} className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExp ? null : order.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${st ? STATUS_COLORS[st].replace("border-", "").split(" ")[0] : "bg-zinc-700/30"}`}>
                    <Icon className={`h-5 w-5 ${st ? STATUS_COLORS[st].split(" ")[1] : "text-zinc-400"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        #{order.externalId}
                      </span>
                      {st && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[st]}`}>
                          {STATUS_LABELS[st]}
                        </span>
                      )}
                      {!st && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-700/30 text-zinc-400 border border-zinc-700">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {st ? STATUS_CLIENT_MESSAGES[st] : "Recibimos tu pedido y está pendiente de revisión."}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      ${order.totalAmount.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  {isExp ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t border-brand-border px-5 py-4 space-y-4">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {order.courier && (
                        <div>
                          <p className="text-xs text-[var(--text-secondary)]">Courier</p>
                          <p className="text-[var(--text-primary)] font-medium">{order.courier}</p>
                        </div>
                      )}
                      {order.trackingCode && (
                        <div>
                          <p className="text-xs text-[var(--text-secondary)]">Código de seguimiento</p>
                          <p className="text-[var(--text-primary)] font-mono text-xs font-medium">{order.trackingCode}</p>
                        </div>
                      )}
                    </div>

                    {/* Note from staff */}
                    {order.clientNote && (
                      <div className="rounded-lg bg-neon-cyan/5 border border-neon-cyan/15 px-4 py-3">
                        <p className="text-xs text-neon-cyan font-semibold mb-1">Mensaje del equipo</p>
                        <p className="text-sm text-[var(--text-primary)]">{order.clientNote}</p>
                      </div>
                    )}

                    {/* Timeline */}
                    {order.history.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                          Historial del pedido
                        </p>
                        <div className="space-y-2">
                          {order.history.map((h, idx) => {
                            const hSt = h.newStatus as OperationalStatus;
                            return (
                              <div key={h.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`h-2.5 w-2.5 rounded-full border-2 mt-0.5 shrink-0 ${STATUS_COLORS[hSt]?.split(" ")[0] ?? "bg-zinc-600"}`} />
                                  {idx < order.history.length - 1 && (
                                    <div className="w-px flex-1 bg-brand-border mt-1" />
                                  )}
                                </div>
                                <div className="pb-3 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${STATUS_COLORS[hSt]?.split(" ")[1] ?? "text-zinc-400"}`}>
                                      {STATUS_LABELS[hSt] ?? h.newStatus}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                      {new Date(h.changedAt).toLocaleString("es-AR")}
                                    </span>
                                  </div>
                                  {h.clientNote && (
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{h.clientNote}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
