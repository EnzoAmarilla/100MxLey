"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Package, AlertTriangle } from "lucide-react";
import { useAdminClient } from "@/contexts/admin-client";
import { NoClientSelected } from "@/components/admin/no-client-selected";

interface InventoryItem {
  id:         string;
  sku:        string;
  name:       string;
  category:   string;
  stock:      number;
  minStock:   number;
  costPrice:  number;
  salePrice:  number;
  soldMonth:  number;
  clientName: string;
  clientEmail: string;
}

export default function AdminClientInventoryPage() {
  const { activeClient, hydrated } = useAdminClient();
  const [items, setItems]   = useState<InventoryItem[]>([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState("");
  const [alert, setAlert]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const fetchInventory = useCallback(() => {
    if (!activeClient) return;
    setLoading(true);
    const params = new URLSearchParams({
      page:     String(page),
      limit:    String(PAGE_SIZE),
      clientId: activeClient.id,
      ...(search ? { search } : {}),
      ...(alert ? { lowStock: "true" } : {}),
    });
    fetch(`/api/admin/client-inventory?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, alert, activeClient]);

  useEffect(() => {
    if (hydrated && activeClient) fetchInventory();
  }, [fetchInventory, hydrated, activeClient]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!hydrated) return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />;
  if (!activeClient) return <NoClientSelected />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{total} productos de {activeClient.name}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar SKU, producto, cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={() => { setAlert((a) => !a); setPage(1); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
            alert
              ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
              : "bg-white/5 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bajo
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stock mín.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vendidos/mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-zinc-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : items.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-zinc-200">{item.clientName}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[100px]">{item.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 text-xs">{item.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-zinc-200 max-w-[180px] truncate">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${isLow ? "text-orange-400" : "text-zinc-200"}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-500">{item.minStock}</td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-400">{item.soldMonth}</td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-300">
                      ${item.salePrice.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <AlertTriangle className="h-3 w-3" /> Stock bajo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Package className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">{total} productos</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40">
              ‹
            </button>
            <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
