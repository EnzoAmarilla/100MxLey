"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Users, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = "active" | "inactive" | "suspended" | "";

interface Client {
  id: string; name: string; email: string; credits: number;
  status: string; createdAt: string; lastLoginAt: string | null;
  totalSpent: number; creditsBought: number; creditsUsed: number;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:    { label: "Activo",    cls: "text-neon-green  bg-neon-green/10  border-neon-green/20" },
  inactive:  { label: "Inactivo",  cls: "text-yellow-400  bg-yellow-400/10  border-yellow-400/20" },
  suspended: { label: "Suspendido",cls: "text-neon-red    bg-neon-red/10    border-neon-red/20" },
};

function fmt(n: number) { return n.toLocaleString("es-AR"); }
function ars(n: number) { return `$${fmt(Math.round(n))}`; }

export default function ClientsPage() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState<Status>("");
  const [sort, setSort]         = useState("createdAt");
  const [loading, setLoading]   = useState(true);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      sort,
      ...(search && { q: search }),
      ...(status && { status }),
    });
    fetch(`/api/superadmin/clients?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, status, sort]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleStatus(v: Status) { setStatus(v); setPage(1); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Clientes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{total} cuentas registradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-neon-purple/50"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {(["", "active", "inactive", "suspended"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => handleStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              status === s
                ? "bg-neon-purple/20 text-neon-purple border-neon-purple/30"
                : "text-[var(--text-secondary)] border-brand-border hover:border-neon-purple/30"
            }`}
          >
            {s === "" ? "Todos" : STATUS_LABELS[s]?.label}
          </button>
        ))}

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-xs text-[var(--text-secondary)] focus:outline-none focus:border-neon-purple/50"
        >
          <option value="createdAt">Alta</option>
          <option value="credits">Créditos</option>
          <option value="lastLogin">Último login</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface">
                {["Cliente", "Estado", "Créditos", "Gastado", "Comprado", "Consumido", "Último login", "Alta", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-brand-surface animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Sin clientes
                  </td>
                </tr>
              ) : clients.map((c) => {
                const st = STATUS_LABELS[c.status] ?? STATUS_LABELS.active;
                return (
                  <tr key={c.id} className="border-b border-brand-border/40 hover:bg-brand-surface transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{c.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-neon-cyan font-semibold">{fmt(c.credits)}</td>
                    <td className="px-4 py-3 text-neon-green">{ars(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{fmt(c.creditsBought)}</td>
                    <td className="px-4 py-3 text-neon-red">{fmt(c.creditsUsed)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString("es-AR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {new Date(c.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/superadmin/clients/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neon-purple border border-neon-purple/20 hover:bg-neon-purple/10 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-brand-surface">
            <p className="text-xs text-[var(--text-secondary)]">Página {page} de {pages} · {total} clientes</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:border-neon-purple/30 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:border-neon-purple/30 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
