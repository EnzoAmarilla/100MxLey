"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck, Search, Filter, X, ChevronDown, Clock, Package, MapPin,
  Calendar, User, AlertCircle, CheckCircle, XCircle, RotateCcw,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pendiente:   { label: "Pendiente",   color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",     dot: "bg-zinc-400" },
  en_revision: { label: "En revisión", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",  dot: "bg-amber-400" },
  coordinada:  { label: "Coordinada",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     dot: "bg-blue-400" },
  en_camino:   { label: "En camino",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30", dot: "bg-violet-400" },
  realizada:   { label: "Realizada",   color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  cancelada:   { label: "Cancelada",   color: "bg-red-500/20 text-red-300 border-red-500/30",        dot: "bg-red-400" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const SHIPPING_LABELS: Record<string, string> = {
  andreani:         "Andreani",
  correo_argentino: "Correo Argentino",
  uber_moto:        "Uber / Moto",
  otro:             "Otro",
};

const SIZE_LABELS: Record<string, string> = {
  pequeño: "Pequeño", mediano: "Mediano", grande: "Grande", mixto: "Mixto",
};

interface PickupRequest {
  id: string;
  address: string; city: string; province: string; postalCode: string;
  packageCount: number; packageSize: string;
  estimatedWeight: string | null;
  preferredDate: string; preferredTimeSlot: string;
  shippingType: string;
  observations: string | null;
  needsPackagingHelp: boolean; alreadyLabeled: boolean;
  hasFulfillmentProducts: boolean; needsQuote: boolean;
  status: string; createdAt: string; updatedAt: string;
  user: { id: string; name: string; email: string };
}

interface HistoryEntry {
  id: string;
  oldStatus: string | null; newStatus: string | null;
  internalNote: string | null; clientNote: string | null;
  createdAt: string;
  changedBy: { name: string; role: string } | null;
}

interface DetailData extends PickupRequest {
  history: HistoryEntry[];
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30", dot: "bg-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DetailModal({ req, onClose, onRefresh }: { req: DetailData; onClose: () => void; onRefresh: () => void }) {
  const [status, setStatus]           = useState(req.status);
  const [internalNote, setInternalNote] = useState("");
  const [clientNote, setClientNote]   = useState("");
  const [noteOnly, setNoteOnly]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  async function saveStatus() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pickup-requests/${req.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, internalNote, clientNote }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      showToast("Estado actualizado correctamente");
      setInternalNote(""); setClientNote("");
      onRefresh();
    } catch { showToast("Error al guardar"); }
    finally { setSaving(false); }
  }

  async function saveNote() {
    if (!internalNote && !clientNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pickup-requests/${req.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNote, clientNote }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      showToast("Nota guardada correctamente");
      setInternalNote(""); setClientNote("");
      onRefresh();
    } catch { showToast("Error al guardar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-900/30 bg-[#0c0a07] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-900/30">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Truck className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Detalle de colecta</h2>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-sm text-zinc-300">{req.user.name}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-500">{req.user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={req.status} />
            <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {toast && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
              {toast}
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Dirección", value: `${req.address}, ${req.city}, ${req.province} (${req.postalCode})`, icon: MapPin },
              { label: "Fecha deseada", value: req.preferredDate, icon: Calendar },
              { label: "Paquetes", value: `${req.packageCount} · ${SIZE_LABELS[req.packageSize] ?? req.packageSize}${req.estimatedWeight ? ` · ${req.estimatedWeight}` : ""}`, icon: Package },
              { label: "Tipo de envío", value: SHIPPING_LABELS[req.shippingType] ?? req.shippingType, icon: Truck },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-zinc-500" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm text-zinc-200">{value}</p>
              </div>
            ))}
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-2">
            {req.needsPackagingHelp    && <span className="px-2.5 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300">Necesita embalaje</span>}
            {req.alreadyLabeled         && <span className="px-2.5 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300">Ya etiquetado</span>}
            {req.hasFulfillmentProducts && <span className="px-2.5 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300">Fulfillment</span>}
            {req.needsQuote             && <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Necesita cotización</span>}
          </div>

          {req.observations && (
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Observaciones del cliente</p>
              <p className="text-sm text-zinc-300">{req.observations}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="rounded-xl border border-amber-900/30 bg-amber-500/[0.03] p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setNoteOnly(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!noteOnly ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  Cambiar estado
                </button>
                <button
                  onClick={() => setNoteOnly(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${noteOnly ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  Solo nota
                </button>
              </div>
            </div>

            {!noteOnly && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nuevo estado</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          status === s ? cfg.color : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nota interna (solo staff)</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={2}
                  placeholder="Visible solo para el equipo..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nota al cliente (visible)</label>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  rows={2}
                  placeholder="Mensaje para el cliente..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={noteOnly ? saveNote : saveStatus}
                disabled={saving || (noteOnly && !internalNote && !clientNote)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? <div className="h-4 w-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* History */}
          {req.history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Historial de cambios</p>
              <div className="space-y-2">
                {req.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-amber-400/60 mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-amber-900/30 mt-1" />
                    </div>
                    <div className="pb-3 flex-1">
                      {(h.oldStatus || h.newStatus) && (
                        <p className="text-xs text-zinc-300 mb-0.5">
                          {h.oldStatus ? <StatusBadge status={h.oldStatus} /> : <span className="text-zinc-500">—</span>}
                          <span className="text-zinc-600 mx-1.5">→</span>
                          {h.newStatus ? <StatusBadge status={h.newStatus} /> : <span className="text-zinc-500">sin cambio</span>}
                        </p>
                      )}
                      {h.internalNote && (
                        <p className="text-xs text-amber-300/70 mt-0.5">
                          <span className="text-zinc-600">[Staff]</span> {h.internalNote}
                        </p>
                      )}
                      {h.clientNote && (
                        <p className="text-xs text-zinc-300 mt-0.5">
                          <span className="text-zinc-600">[Cliente]</span> {h.clientNote}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {h.changedBy?.name ?? "Sistema"} · {new Date(h.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminColectasPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<DetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/pickup-requests?${params}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
      setTotal(data.total ?? 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/pickup-requests/${id}`);
      const data = await res.json();
      setSelected(data.request);
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  }

  async function refreshDetail() {
    if (!selected) return;
    await openDetail(selected.id);
    load();
  }

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Modal */}
      {selected && (
        <DetailModal req={selected} onClose={() => setSelected(null)} onRefresh={refreshDetail} />
      )}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="h-8 w-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Truck className="h-5 w-5 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Colectas</h1>
        </div>
        <p className="text-sm text-zinc-400">Solicitudes de retiro de paquetes de los clientes.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`rounded-xl border p-3 text-left transition-all ${
              filterStatus === key
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
            }`}
          >
            <p className="text-xl font-bold text-white">{statusCounts[key] ?? 0}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, ciudad, dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        </div>
        {(search || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Cliente / Dirección</span>
          <span>Paquetes</span>
          <span>Fecha deseada</span>
          <span>Tipo envío</span>
          <span>Estado</span>
          <span>Acción</span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 px-5 flex items-center gap-4">
                <div className="flex-1 h-4 rounded bg-white/5 animate-pulse" />
                <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
                <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
                <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
                <div className="w-20 h-6 rounded-full bg-white/5 animate-pulse" />
                <div className="w-16 h-8 rounded-lg bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <Truck className="h-10 w-10 text-amber-500/20 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No hay colectas con los filtros actuales</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {requests.map((req) => (
              <div key={req.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <p className="text-sm font-medium text-zinc-200 truncate">{req.user.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{req.address}, {req.city}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-200">{req.packageCount}</p>
                  <p className="text-[10px] text-zinc-500">{SIZE_LABELS[req.packageSize] ?? req.packageSize}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {req.preferredDate}
                </div>
                <div className="text-xs text-zinc-400 whitespace-nowrap">
                  {SHIPPING_LABELS[req.shippingType] ?? req.shippingType}
                </div>
                <StatusBadge status={req.status} />
                <button
                  onClick={() => openDetail(req.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all whitespace-nowrap"
                >
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {total > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-zinc-500">
            {total} colecta{total !== 1 ? "s" : ""} en total
          </div>
        )}
      </div>
    </div>
  );
}
