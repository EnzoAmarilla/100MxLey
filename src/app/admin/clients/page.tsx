"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Wifi, Clock, Package, ShoppingBag, ChevronRight, RefreshCw, WifiOff } from "lucide-react";
import { useAdminClient, type ActiveClient } from "@/contexts/admin-client";

interface ClientStore {
  id: string; platform: string; storeId: string;
  storeName: string; domain: string | null;
  lastSync: string | null; lastProductSync: string | null;
}
interface ConnectedClient {
  id: string; name: string; email: string; status: string;
  credits: number; createdAt: string; lastLoginAt: string | null;
  store: ClientStore[]; _count: { order: number; product: number };
}

function syncStatus(store: ClientStore): "connected" | "pending" {
  if (!store.lastSync) return "pending";
  return Date.now() - new Date(store.lastSync).getTime() < 2 * 3600000 ? "connected" : "pending";
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const { setActiveClient }   = useAdminClient();
  const router                = useRouter();

  const load = useCallback((q: string) => {
    setLoading(true);
    fetch(`/api/admin/clients?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(""); }, [load]);

  const select = (c: ConnectedClient) => {
    const primary = c.store.find((s) => s.platform === "tiendanube") ?? c.store[0];
    const client: ActiveClient = { id: c.id, name: c.name, email: c.email, storeName: primary?.storeName ?? "" };
    setActiveClient(client);
    router.push("/admin");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes conectados</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Seleccioná un cliente para gestionar su operación</p>
        </div>
        <button onClick={() => load(search)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-300 text-sm hover:bg-white/10 transition-all">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
          placeholder="Buscar por nombre o email…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando clientes…</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-500">No hay clientes con integraciones activas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Integración</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Créditos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pedidos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Última sync</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {clients.map((c) => {
                  const primary   = c.store.find((s) => s.platform === "tiendanube") ?? c.store[0];
                  const connected = primary ? syncStatus(primary) === "connected" : false;
                  const PIcon     = primary?.platform === "shopify" ? ShoppingBag : Package;

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-amber-400">{c.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{c.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {primary ? (
                          <div className="flex items-center gap-2">
                            <PIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-300 truncate">{primary.storeName}</p>
                              <p className="text-[10px] text-zinc-500 capitalize">{primary.platform}</p>
                            </div>
                          </div>
                        ) : <span className="text-xs text-zinc-600">Sin tienda</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.status === "active" ? (
                          <div className="flex items-center gap-1.5">
                            {connected
                              ? <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                              : <Clock className="h-3.5 w-3.5 text-amber-400" />}
                            <span className={`text-xs font-medium ${connected ? "text-emerald-400" : "text-amber-400"}`}>
                              {connected ? "Conectado" : "Sin sync reciente"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <WifiOff className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="text-xs text-zinc-500">Inactivo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-amber-400">{Math.floor(c.credits)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-zinc-300">{c._count.order}</td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400">
                        {primary?.lastSync
                          ? new Date(primary.lastSync).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
                          : <span className="text-zinc-600">Nunca</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => select(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Gestionar <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-600 text-center">{clients.length} cliente{clients.length !== 1 ? "s" : ""} con integración activa</p>
    </div>
  );
}
