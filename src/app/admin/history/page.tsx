"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { History, ChevronLeft, ChevronRight, Lock, MessageSquare } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, type OperationalStatus } from "@/lib/admin";
import { useAdminClient } from "@/contexts/admin-client";
import { NoClientSelected } from "@/components/admin/no-client-selected";

interface HistoryEntry {
  id: string; orderId: string; orderExternalId: string;
  oldStatus: string | null; newStatus: string;
  internalNote: string | null; clientNote: string | null;
  changedAt: string; changedBy: string | null;
}

export default function AdminHistoryPage() {
  const { activeClient, hydrated } = useAdminClient();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 30;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(() => {
    if (!activeClient) return;
    setLoading(true);
    const params = new URLSearchParams({ clientId: activeClient.id, page: String(page), limit: String(PAGE_SIZE) });
    fetch(`/api/admin/history?${params}`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClient, page]);

  useEffect(() => { if (hydrated && activeClient) load(); }, [load, hydrated, activeClient]);

  if (!hydrated) return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />;
  if (!activeClient) return <NoClientSelected />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Historial operativo</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{total} movimientos de {activeClient.name}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando historial…</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-500">No hay movimientos registrados.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cambio de estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Staff</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {entries.map((e) => {
                  const newSt = e.newStatus as OperationalStatus;
                  const oldSt = e.oldStatus as OperationalStatus | null;
                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(e.changedAt).toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/orders/${e.orderId}`} className="font-mono text-amber-400 text-xs hover:underline">
                          #{e.orderExternalId}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {oldSt && (
                            <>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[oldSt] ?? "text-zinc-400 border-zinc-700"}`}>
                                {STATUS_LABELS[oldSt] ?? oldSt}
                              </span>
                              <span className="text-zinc-600 text-xs">→</span>
                            </>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[newSt] ?? "text-zinc-400 border-zinc-700"}`}>
                            {STATUS_LABELS[newSt] ?? e.newStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400">{e.changedBy ?? "Sistema"}</td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="space-y-0.5">
                          {e.internalNote && (
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{e.internalNote}</span>
                            </p>
                          )}
                          {e.clientNote && (
                            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{e.clientNote}</span>
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-zinc-500">{total} registros</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
