"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, OPERATIONAL_STATUSES, type OperationalStatus } from "@/lib/admin";

interface AdminOrder {
  id:               string;
  externalId:       string;
  buyerName:        string;
  buyerEmail:       string;
  status:           string;
  operationalStatus: string | null;
  totalAmount:      number;
  createdAt:        string;
  updatedAt:        string | null;
  clientName:       string;
  clientEmail:      string;
  lastUpdatedBy:    string | null;
  trackingCode:     string | null;
}

const ALL_STATUS = ["all", ...OPERATIONAL_STATUSES] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<AdminOrder[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("all");
  const [loading, setLoading] = useState(true);

  // Inline status update
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(search ? { search } : {}),
      ...(status !== "all" ? { status } : {}),
    });
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, operationalStatus: newStatus } : o)
      );
      showToast("Estado actualizado", true);
    } catch {
      showToast("Error al actualizar el estado", false);
    } finally {
      setUpdating(null);
    }
  };

  const opStatus = (o: AdminOrder): OperationalStatus | null =>
    (o.operationalStatus as OperationalStatus) ?? null;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all ${
          toast.ok
            ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-300"
            : "bg-red-900/80 border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos / Logística</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{total} pedidos en total</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-sm border border-zinc-700/50 transition-all">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar cliente, pedido, email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1 border border-zinc-700/50">
          <Filter className="h-3.5 w-3.5 text-zinc-500 ml-1" />
          {ALL_STATUS.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                status === s
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s as OperationalStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Additional status filters */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUS.slice(5).map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              status === s
                ? STATUS_COLORS[s as OperationalStatus]
                : "bg-white/5 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
            }`}
          >
            {STATUS_LABELS[s as OperationalStatus]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Comprador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado operativo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Responsable</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : orders.map((order) => {
                const st = opStatus(order);
                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-200 text-xs">{order.clientName}</p>
                      <p className="text-zinc-500 text-xs truncate max-w-[120px]">{order.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 text-xs">#{order.externalId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-300 text-xs">{order.buyerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.operationalStatus ?? ""}
                        disabled={updating === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs rounded-md px-2 py-1 border bg-transparent cursor-pointer focus:outline-none disabled:opacity-50 ${
                          st ? STATUS_COLORS[st] : "text-zinc-500 border-zinc-700"
                        }`}
                      >
                        <option value="" disabled className="bg-zinc-900">Sin asignar</option>
                        {OPERATIONAL_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-zinc-900">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">
                      ${order.totalAmount.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {order.lastUpdatedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" /> Detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
