"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Clock } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, STATUS_CLIENT_MESSAGES, OPERATIONAL_STATUSES, type OperationalStatus } from "@/lib/admin";

interface StatusHistory {
  id:           string;
  oldStatus:    string | null;
  newStatus:    string;
  internalNote: string | null;
  clientNote:   string | null;
  changedAt:    string;
  changedBy:    string | null;
}

interface OrderDetail {
  id:               string;
  externalId:       string;
  buyerName:        string;
  buyerEmail:       string;
  address:          string;
  products:         string;
  totalAmount:      number;
  shippingCost:     number;
  status:           string;
  operationalStatus: string | null;
  trackingCode:     string | null;
  courier:          string | null;
  adminNote:        string | null;
  clientNote:       string | null;
  createdAt:        string;
  clientName:       string;
  clientEmail:      string;
  lastUpdatedBy:    string | null;
  history:          StatusHistory[];
}

export default function AdminOrderDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [order, setOrder]     = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [newStatus,       setNewStatus]       = useState("");
  const [internalNote,    setInternalNote]    = useState("");
  const [clientNote,      setClientNote]      = useState("");
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setNewStatus(d.operationalStatus ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!newStatus) return showToast("Seleccioná un estado", false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, internalNote: internalNote || null, clientNote: clientNote || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await fetch(`/api/admin/orders/${id}`).then((r) => r.json());
      setOrder(updated);
      setInternalNote("");
      setClientNote("");
      showToast("Pedido actualizado correctamente", true);
    } catch {
      showToast("Error al guardar", false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 text-zinc-500">Pedido no encontrado</div>
  );

  const currentSt = order.operationalStatus as OperationalStatus | null;

  return (
    <div className="space-y-6 max-w-4xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${
          toast.ok ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-300"
                   : "bg-red-900/80 border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-zinc-700/50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Pedido #{order.externalId}</h1>
          <p className="text-xs text-zinc-400">Cliente: {order.clientName}</p>
        </div>
        {currentSt && (
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[currentSt]}`}>
            {STATUS_LABELS[currentSt]}
          </span>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Datos del pedido</h2>
          <Row label="Comprador"     value={order.buyerName} />
          <Row label="Email"         value={order.buyerEmail} />
          <Row label="Monto"         value={`$${order.totalAmount.toLocaleString("es-AR")}`} />
          <Row label="Envío"         value={`$${order.shippingCost.toLocaleString("es-AR")}`} />
          {order.courier     && <Row label="Courier"      value={order.courier} />}
          {order.trackingCode && <Row label="Tracking"    value={order.trackingCode} />}
          <Row label="Fecha"         value={new Date(order.createdAt).toLocaleString("es-AR")} />
          <Row label="Estado plataforma" value={order.status} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Datos del cliente</h2>
          <Row label="Nombre"  value={order.clientName} />
          <Row label="Email"   value={order.clientEmail} />
          {order.lastUpdatedBy && <Row label="Último responsable" value={order.lastUpdatedBy} />}
          <div>
            <p className="text-xs text-zinc-500 mb-1">Dirección de entrega</p>
            <p className="text-xs text-zinc-300 break-words">{order.address}</p>
          </div>
        </div>
      </div>

      {/* Update status panel */}
      <div className="rounded-xl border border-amber-900/40 bg-amber-500/[0.03] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-amber-400">Actualizar estado operativo</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="text-xs text-zinc-400 mb-1.5 block">Estado</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="" disabled>Seleccionar estado</option>
              {OPERATIONAL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 mb-1.5 block">Nota interna (solo visible para staff)</label>
            <input
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Ej: Revisar dirección antes de enviar..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Nota para el cliente (visible en su panel)</label>
          <input
            value={clientNote}
            onChange={(e) => setClientNote(e.target.value)}
            placeholder="Ej: Tu pedido saldrá mañana por DHL..."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !newStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            <Send className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Status history */}
      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Historial de estados</h2>
        </div>
        {order.history.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-8">Sin historial aún</p>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {order.history.map((h) => (
              <div key={h.id} className="px-5 py-4 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {h.oldStatus && (
                    <>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[h.oldStatus as OperationalStatus] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"}`}>
                        {STATUS_LABELS[h.oldStatus as OperationalStatus] ?? h.oldStatus}
                      </span>
                      <span className="text-zinc-600 text-xs">→</span>
                    </>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[h.newStatus as OperationalStatus] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"}`}>
                    {STATUS_LABELS[h.newStatus as OperationalStatus] ?? h.newStatus}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">{new Date(h.changedAt).toLocaleString("es-AR")}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Por: <span className="text-zinc-400">{h.changedBy ?? "Sistema"}</span>
                </p>
                {h.internalNote && (
                  <p className="text-xs bg-amber-500/5 border border-amber-500/15 text-amber-300 px-3 py-1.5 rounded-lg">
                    🔒 Nota interna: {h.internalNote}
                  </p>
                )}
                {h.clientNote && (
                  <p className="text-xs bg-blue-500/5 border border-blue-500/15 text-blue-300 px-3 py-1.5 rounded-lg">
                    💬 Nota para cliente: {h.clientNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className="text-xs text-zinc-200 text-right truncate">{value}</span>
    </div>
  );
}
