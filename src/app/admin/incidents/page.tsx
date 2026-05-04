"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { STATUS_COLORS } from "@/lib/admin";
import { useAdminClient } from "@/contexts/admin-client";
import { NoClientSelected } from "@/components/admin/no-client-selected";

interface Incident {
  id: string; externalId: string; buyerName: string; buyerEmail: string;
  totalAmount: number; createdAt: string; clientNote: string | null;
  lastUpdatedBy: string | null;
}

export default function AdminIncidentsPage() {
  const { activeClient, hydrated } = useAdminClient();
  const [items, setItems]     = useState<Incident[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!activeClient) return;
    setLoading(true);
    const params = new URLSearchParams({ clientId: activeClient.id, status: "incidencia", limit: "50" });
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.orders ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClient]);

  useEffect(() => { if (hydrated && activeClient) load(); }, [load, hydrated, activeClient]);

  if (!hydrated) return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />;
  if (!activeClient) return <NoClientSelected />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidencias</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{total} incidencia{total !== 1 ? "s" : ""} de {activeClient.name}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-300 text-sm hover:bg-white/10 transition-all">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando incidencias…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-500">No hay incidencias activas para este cliente.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Comprador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nota al cliente</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {items.map((inc) => (
                <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-amber-400 text-xs">#{inc.externalId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-zinc-300">{inc.buyerName}</p>
                    <p className="text-[10px] text-zinc-500">{inc.buyerEmail}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS.incidencia}`}>
                      Incidencia
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="text-xs text-zinc-400 truncate">{inc.clientNote ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-zinc-300">
                    ${inc.totalAmount.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">
                    {new Date(inc.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${inc.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
