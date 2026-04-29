"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  RefreshCw,
  BarChart3,
  X,
  Save,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  platform: string | null;
  externalId: string | null;
  minStock: number;
  costPrice: number;
  salePrice: number;
  promoPrice: number | null;
  soldMonth: number;
}

const CATEGORIES = ["Camisetas", "Remeras", "Pantalones", "Buzos", "Jackets", "Shorts", "Accesorios", "Otro"];

type SortKey = "name" | "sku" | "stock" | "salePrice" | "soldMonth";

const emptyForm = {
  sku: "", name: "", category: "Camisetas",
  stock: "", minStock: "", costPrice: "", salePrice: "", promoPrice: "", soldMonth: "0",
};

function formatARS(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000)     return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function stockStatus(stock: number, min: number) {
  if (stock === 0)   return { label: "Sin stock",  variant: "red"    as const, color: "text-neon-red"    };
  if (stock <= min)  return { label: "Stock bajo", variant: "yellow" as const, color: "text-neon-yellow" };
  return               { label: "Óptimo",       variant: "green"  as const, color: "text-neon-green"  };
}

function SkeletonRow() {
  return (
    <tr className="border-b border-brand-border">
      {[12, 32, 20, 10, 10, 16, 16, 12, 14, 16].map((w, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className={`h-3 w-${w} rounded bg-brand-surface animate-pulse`} />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ field, sortBy, sortDir }: { field: SortKey; sortBy: SortKey; sortDir: "asc" | "desc" }) {
  if (sortBy !== field) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-neon-cyan" />
    : <ChevronDown className="h-3 w-3 text-neon-cyan" />;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy]     = useState<SortKey>("name");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  const [showModal, setShowModal]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formErrors, setFormErrors]     = useState<Partial<typeof emptyForm>>({});
  const [saving, setSaving]             = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/stock");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleTNSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res  = await fetch("/api/integrations/tiendanube/sync-products", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg({ ok: true, text: `Sincronización completa: ${data.count} variantes importadas desde Tiendanube.` });
        fetchProducts();
        setTimeout(() => setSyncMsg(null), 8000);
      } else {
        setSyncMsg({ ok: false, text: data.detail ? `${data.error}: ${data.detail}` : (data.error || "Error al sincronizar") });
      }
    } catch {
      setSyncMsg({ ok: false, text: "Error de conexión. Intentá de nuevo." });
    } finally {
      setSyncing(false);
    }
  };

  // ── Computed metrics ──────────────────────────────────────────────
  const totalValue  = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const totalSold   = products.reduce((s, p) => s + p.soldMonth, 0);
  const lowStock    = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock  = products.filter((p) => p.stock === 0).length;

  // ── Filter + sort ─────────────────────────────────────────────────
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (statusFilter === "out"  && p.stock !== 0) return false;
      if (statusFilter === "low"  && !(p.stock > 0 && p.stock <= p.minStock)) return false;
      if (statusFilter === "ok"   && (p.stock === 0 || p.stock <= p.minStock)) return false;
      return true;
    })
    .sort((a, b) => {
      let va: string | number = a[sortBy];
      let vb: string | number = b[sortBy];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  }

  // ── Modal open helpers ────────────────────────────────────────────
  function openAdd() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({
      sku:        p.sku,
      name:       p.name,
      category:   p.category,
      stock:      String(p.stock),
      minStock:   String(p.minStock),
      costPrice:  String(p.costPrice),
      salePrice:  String(p.salePrice),
      promoPrice: p.promoPrice != null ? String(p.promoPrice) : "",
      soldMonth:  String(p.soldMonth),
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  // ── Form validation ───────────────────────────────────────────────
  function validate() {
    const e: Partial<typeof emptyForm> = {};
    if (!form.sku.trim())    e.sku       = "Requerido";
    if (!form.name.trim())   e.name      = "Requerido";
    if (form.stock === "")   e.stock     = "Requerido";
    if (form.minStock === "") e.minStock = "Requerido";
    if (form.costPrice === "") e.costPrice = "Requerido";
    if (form.salePrice === "") e.salePrice = "Requerido";
    // SKU uniqueness check (client-side, exclude current if editing)
    const conflict = products.find(
      (p) => p.sku === form.sku.toUpperCase().trim() && p.id !== editingProduct?.id
    );
    if (conflict) e.sku = "SKU ya existe";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        sku:        form.sku,
        name:       form.name,
        category:   form.category,
        stock:      Number(form.stock),
        minStock:   Number(form.minStock),
        costPrice:  Number(form.costPrice),
        salePrice:  Number(form.salePrice),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        soldMonth:  Number(form.soldMonth),
      };
      let res: Response;
      if (editingProduct) {
        res = await fetch(`/api/stock/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        setFormErrors({ sku: err.error || "Error al guardar" });
        return;
      }
      closeModal();
      fetchProducts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/stock/${confirmDelete.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchProducts();
    } finally {
      setDeleting(false);
    }
  }

  // ── Field component ───────────────────────────────────────────────
  function Field({
    label, field, type = "text", placeholder = "",
  }: {
    label: string; field: keyof typeof emptyForm; type?: string; placeholder?: string;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">{label}</label>
        <input
          type={type}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-brand-surface px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 focus:outline-none transition-all ${
            formErrors[field]
              ? "border-neon-red/60 focus:border-neon-red"
              : "border-brand-border focus:border-neon-cyan/50 focus:shadow-[0_0_0_1px_rgba(0,245,255,0.12)]"
          }`}
        />
        {formErrors[field] && <p className="text-xs text-neon-red">{formErrors[field]}</p>}
      </div>
    );
  }

  const thBtn = (key: SortKey, label: string) => (
    <th
      className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
      onClick={() => toggleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={key} sortBy={sortBy} sortDir={sortDir} />
      </div>
    </th>
  );

  const lowStockNames = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).map((p) => p.name);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Package className="h-7 w-7 text-neon-cyan" />
            Stock
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-widest uppercase">Inventario · Indumentaria Mxley</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTNSync}
            disabled={syncing || loading}
            className="gap-2 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/5"
          >
            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            {syncing ? "Sincronizando..." : "Sync Tiendanube"}
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchProducts} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncMsg && (
        <div className={[
          "rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between",
          syncMsg.ok
            ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
            : "bg-neon-red/10 border border-neon-red/30 text-neon-red",
        ].join(" ")}>
          {syncMsg.text}
          <button onClick={() => setSyncMsg(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Stock-bajo alert */}
      {!loading && lowStock > 0 && (
        <div className="relative flex items-start gap-3 rounded-xl border border-neon-yellow/25 bg-neon-yellow/[0.04] p-4 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-yellow/40 to-transparent" />
          <AlertTriangle className="h-4 w-4 text-neon-yellow mt-0.5 shrink-0 drop-shadow-[0_0_6px_#FFB700]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {lowStock} producto{lowStock > 1 ? "s" : ""} con stock bajo
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {lowStockNames.slice(0, 4).join(", ")}{lowStockNames.length > 4 ? ` y ${lowStockNames.length - 4} más` : ""} — por debajo del mínimo.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Valor del stock",       value: loading ? "—" : formatARS(totalValue), icon: Package,      color: "text-neon-cyan",   glow: "via-neon-cyan/30"   },
          { label: "Unidades vendidas",     value: loading ? "—" : totalSold,             icon: BarChart3,    color: "text-neon-green",  glow: "via-neon-green/30"  },
          { label: "Productos bajo mínimo", value: loading ? "—" : lowStock,              icon: TrendingDown, color: "text-neon-yellow", glow: "via-neon-yellow/30" },
          { label: "Sin stock",             value: loading ? "—" : outOfStock,            icon: AlertTriangle,color: "text-neon-red",    glow: "via-neon-red/30"    },
        ].map((c) => (
          <div key={c.label} className="relative rounded-xl border border-brand-border bg-brand-card p-5 transition-all duration-300 hover:border-neon-cyan/20">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${c.glow} to-transparent rounded-t-xl`} />
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{c.label}</p>
            </div>
            <p className={`text-2xl font-bold font-mono ${loading ? "animate-pulse text-brand-surface" : c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="relative rounded-xl border border-brand-border bg-brand-card overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

        {/* Table toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-brand-border">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-surface pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-neon-cyan/40 transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan/40 transition-colors"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan/40 transition-colors"
          >
            <option value="">Todos los estados</option>
            <option value="ok">Óptimo</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>

          <span className="text-xs text-[var(--text-secondary)] ml-auto">
            {loading ? "Cargando..." : `${filtered.length} de ${products.length} productos`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface">
                {thBtn("sku",      "SKU")}
                {thBtn("name",     "Producto")}
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">Categoría</th>
                {thBtn("stock",    "Stock")}
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">Mínimo</th>
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">Costo unit.</th>
                {thBtn("salePrice","Precio venta")}
                {thBtn("soldMonth","Vendidos (mes)")}
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">Estado</th>
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-10 w-10 text-[var(--text-secondary)] opacity-20" />
                      <p className="text-sm text-[var(--text-secondary)]">
                        {products.length === 0
                          ? "No hay productos. Agregá el primero."
                          : "Sin resultados para los filtros aplicados."}
                      </p>
                      {products.length === 0 && (
                        <Button size="sm" onClick={openAdd} className="mt-1 gap-2">
                          <Plus className="h-3.5 w-3.5" />
                          Nuevo producto
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const s = stockStatus(p.stock, p.minStock);
                  const barPct = p.minStock > 0
                    ? Math.min((p.stock / (p.minStock * 3)) * 100, 100)
                    : 100;
                  const barColor =
                    p.stock === 0       ? "bg-neon-red"    :
                    p.stock <= p.minStock ? "bg-neon-yellow" : "bg-neon-green";
                  const effectivePrice = p.promoPrice ?? p.salePrice;
                  const margin = effectivePrice > 0
                    ? ((effectivePrice - p.costPrice) / effectivePrice * 100)
                    : 0;

                  return (
                    <tr key={p.id} className="border-b border-brand-border hover:bg-brand-surface/60 transition-colors duration-150 group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {p.platform === "tiendanube" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 leading-none">
                              <ShoppingBag className="h-2.5 w-2.5" /> TN
                            </span>
                          )}
                          <span className="font-mono text-neon-cyan/80 text-xs">{p.sku}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-primary)] text-xs font-medium whitespace-nowrap max-w-[200px] truncate">{p.name}</td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">{p.category}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${s.color}`}>{p.stock}</span>
                          <div className="w-14 h-1.5 rounded-full bg-brand-bg overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)] text-xs">{p.minStock}</td>
                      <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)] text-xs">${p.costPrice.toLocaleString("es-AR")}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {p.promoPrice ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[var(--text-secondary)] text-xs line-through">${p.salePrice.toLocaleString("es-AR")}</span>
                                {margin > 0 && (
                                  <span className="text-[10px] text-neon-green font-mono">{margin.toFixed(0)}%</span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-neon-cyan text-xs">${p.promoPrice.toLocaleString("es-AR")}</span>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[var(--text-primary)] text-xs">${p.salePrice.toLocaleString("es-AR")}</span>
                              {margin > 0 && (
                                <span className="text-[10px] text-neon-green font-mono">{margin.toFixed(0)}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className={`flex items-center gap-1 text-xs font-medium ${p.soldMonth > 0 ? "text-neon-green" : "text-[var(--text-secondary)]"}`}>
                          {p.soldMonth > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          <span className="font-mono">{p.soldMonth}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary" size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {p.platform === "tiendanube" && p.externalId && (
                            <a
                              href={`https://www.tiendanube.com/admin/products/${p.externalId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-brand-border bg-brand-surface text-[var(--text-secondary)] hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
                              title="Ver en Tiendanube"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-neon-red/70 hover:text-neon-red hover:bg-neon-red/10"
                            onClick={() => setConfirmDelete(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-xl border border-neon-cyan/25 bg-brand-card shadow-[0_0_60px_rgba(0,245,255,0.08)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-neon-cyan" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingProduct ? "Editar producto" : "Nuevo producto"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-[var(--text-secondary)] hover:text-neon-red transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU" field="sku" placeholder="Ej: CAM-BLA-XL" />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <Field label="Nombre del producto" field="name" placeholder="Ej: Camiseta blanca talle XL" />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock actual" field="stock" type="number" placeholder="0" />
                <Field label="Stock mínimo" field="minStock" type="number" placeholder="5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Costo unitario ($)" field="costPrice" type="number" placeholder="3200" />
                <Field label="Precio de venta ($)" field="salePrice" type="number" placeholder="8500" />
              </div>

              <Field label="Precio promocional ($) — opcional" field="promoPrice" type="number" placeholder="Sin promoción" />

              <Field label="Vendidos este mes" field="soldMonth" type="number" placeholder="0" />

              {form.costPrice && form.salePrice && Number(form.salePrice) > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-neon-green/5 border border-neon-green/20 px-3 py-2">
                  <TrendingUp className="h-3.5 w-3.5 text-neon-green shrink-0" />
                  <p className="text-xs text-neon-green">
                    Margen:{" "}
                    <span className="font-mono font-bold">
                      {(((Number(form.salePrice) - Number(form.costPrice)) / Number(form.salePrice)) * 100).toFixed(1)}%
                    </span>
                    {" · "}Ganancia:{" "}
                    <span className="font-mono font-bold">
                      ${(Number(form.salePrice) - Number(form.costPrice)).toLocaleString("es-AR")}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border">
              <Button variant="ghost" size="sm" onClick={closeModal}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Guardando..." : "Guardar producto"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-neon-red/30 bg-brand-card shadow-[0_0_40px_rgba(255,50,50,0.08)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-red/50 to-transparent" />
            <div className="px-6 py-5 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-neon-red/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-neon-red" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Eliminar producto</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                ¿Eliminás <span className="font-medium text-[var(--text-primary)]">{confirmDelete.name}</span>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-neon-red/10 text-neon-red border-neon-red/30 hover:bg-neon-red/20 gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
