"use client";

import { useState } from "react";
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
} from "lucide-react";

const initialProducts: any[] = [];

const categories = ["Camisetas", "Remeras", "Pantalones", "Buzos", "Jackets", "Shorts", "Accesorios", "Otro"];

function formatARS(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function stockStatus(stock: number, min: number) {
  if (stock === 0)    return { label: "Sin stock",  variant: "red"    as const, color: "text-neon-red"    };
  if (stock <= min)   return { label: "Stock bajo", variant: "yellow" as const, color: "text-neon-yellow" };
  if (stock <= min*2) return { label: "Normal",     variant: "cyan"   as const, color: "text-neon-cyan"   };
  return                     { label: "Óptimo",     variant: "green"  as const, color: "text-neon-green"  };
}

const emptyForm = { sku: "", name: "", category: "Camisetas", stock: "", min: "", cost: "", price: "" };

export default function StockPage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [errors, setErrors]       = useState<Partial<typeof emptyForm>>({});

  const totalValue = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const totalSold  = products.reduce((s, p) => s + p.sold, 0);
  const lowStock   = products.filter((p) => p.stock > 0 && p.stock <= p.min).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e: Partial<typeof emptyForm> = {};
    if (!form.sku.trim())   e.sku   = "Requerido";
    if (!form.name.trim())  e.name  = "Requerido";
    if (!form.stock)        e.stock = "Requerido";
    if (!form.min)          e.min   = "Requerido";
    if (!form.cost)         e.cost  = "Requerido";
    if (!form.price)        e.price = "Requerido";
    if (products.find((p) => p.sku === form.sku.toUpperCase().trim())) e.sku = "SKU ya existe";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setProducts([...products, {
      sku:      form.sku.toUpperCase().trim(),
      name:     form.name.trim(),
      category: form.category,
      stock:    Number(form.stock),
      min:      Number(form.min),
      cost:     Number(form.cost),
      price:    Number(form.price),
      sold:     0,
      trend:    0,
    }]);
    setForm(emptyForm);
    setErrors({});
    setShowModal(false);
  }

  function Field({ label, field, type = "text", placeholder = "" }: { label: string; field: keyof typeof emptyForm; type?: string; placeholder?: string }) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">{label}</label>
        <input
          type={type}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-brand-surface px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 focus:outline-none transition-all ${
            errors[field]
              ? "border-neon-red/60 focus:border-neon-red"
              : "border-brand-border focus:border-neon-cyan/50 focus:shadow-[0_0_0_1px_rgba(0,245,255,0.12)]"
          }`}
        />
        {errors[field] && <p className="text-xs text-neon-red">{errors[field]}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stock</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-widest uppercase">Inventario · Indumentaria Mxley</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {lowStock > 0 && (
        <div className="relative flex items-start gap-3 rounded-xl border border-neon-yellow/25 bg-neon-yellow/[0.04] p-4 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-yellow/40 to-transparent" />
          <AlertTriangle className="h-4 w-4 text-neon-yellow mt-0.5 shrink-0 drop-shadow-[0_0_6px_#FFB700]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {lowStock} producto{lowStock > 1 ? "s" : ""} con stock bajo
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {products.filter(p => p.stock > 0 && p.stock <= p.min).map(p => p.name).join(" y ")} — por debajo del mínimo.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Valor del stock",       value: formatARS(totalValue), icon: Package,      color: "text-neon-cyan",   glow: "via-neon-cyan/30"   },
          { label: "Unidades vendidas",     value: totalSold,             icon: BarChart3,    color: "text-neon-green",  glow: "via-neon-green/30"  },
          { label: "Productos bajo mínimo", value: lowStock,              icon: TrendingDown, color: "text-neon-yellow", glow: "via-neon-yellow/30" },
          { label: "Sin stock",             value: outOfStock,            icon: AlertTriangle,color: "text-neon-red",    glow: "via-neon-red/30"    },
        ].map((c) => (
          <div key={c.label} className="relative rounded-xl border border-brand-border bg-brand-card p-5 transition-all duration-300 hover:border-neon-cyan/20">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${c.glow} to-transparent rounded-t-xl`} />
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{c.label}</p>
            </div>
            <p className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="relative rounded-xl border border-brand-border bg-brand-card overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
        <div className="flex items-center gap-4 px-5 py-4 border-b border-brand-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-surface pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-neon-cyan/40 transition-colors"
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] ml-auto">{filtered.length} productos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface">
                {["SKU", "Producto", "Categoría", "Stock", "Mínimo", "Costo unit.", "Precio venta", "Vendidos (mes)", "Tendencia", "Estado"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const s = stockStatus(p.stock, p.min);
                const barPct  = Math.min((p.stock / (p.min * 3)) * 100, 100);
                const barColor =
                  p.stock === 0     ? "bg-neon-red"    :
                  p.stock <= p.min  ? "bg-neon-yellow" :
                  p.stock <= p.min*2? "bg-neon-cyan"   : "bg-neon-green";
                return (
                  <tr key={p.sku} className="border-b border-brand-border hover:bg-brand-surface transition-colors">
                    <td className="px-5 py-3.5 font-mono text-neon-cyan/80 text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-[var(--text-primary)] text-xs font-medium whitespace-nowrap">{p.name}</td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">{p.category}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-sm ${s.color}`}>{p.stock}</span>
                        <div className="w-16 h-1.5 rounded-full bg-brand-bg overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)] text-xs">{p.min}</td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)] text-xs">${p.cost.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[var(--text-primary)] text-xs">${p.price.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-3.5 font-mono text-neon-cyan/80 text-xs">{p.sold}</td>
                    <td className="px-5 py-3.5">
                      <div className={`flex items-center gap-1 text-xs font-medium ${p.trend >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                        {p.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span className="font-mono">{p.trend >= 0 ? "+" : ""}{p.trend}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge variant={s.variant}>{s.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal nuevo producto ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-lg rounded-xl border border-neon-cyan/25 bg-brand-card shadow-[0_0_60px_rgba(0,245,255,0.08)] overflow-hidden">
            {/* Top glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-neon-cyan" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Nuevo producto</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)] hover:text-neon-red transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU" field="sku" placeholder="EJ: CAM-BLA-XL" />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <Field label="Nombre del producto" field="name" placeholder="Ej: Camiseta blanca talle XL" />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock inicial" field="stock" type="number" placeholder="0" />
                <Field label="Stock mínimo" field="min" type="number" placeholder="5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Costo unitario ($)" field="cost" type="number" placeholder="3200" />
                <Field label="Precio de venta ($)" field="price" type="number" placeholder="8500" />
              </div>

              {form.cost && form.price && Number(form.price) > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-neon-green/5 border border-neon-green/20 px-3 py-2">
                  <TrendingUp className="h-3.5 w-3.5 text-neon-green shrink-0" />
                  <p className="text-xs text-neon-green">
                    Margen: <span className="font-mono font-bold">
                      {(((Number(form.price) - Number(form.cost)) / Number(form.price)) * 100).toFixed(1)}%
                    </span>
                    {" · "}Ganancia por unidad: <span className="font-mono font-bold">
                      ${(Number(form.price) - Number(form.cost)).toLocaleString("es-AR")}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border">
              <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); setForm(emptyForm); setErrors({}); }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />
                Guardar producto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
