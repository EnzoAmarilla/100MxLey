"use client";

import { useEffect, useState } from "react";
import { Coins, Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditPackage {
  id: string; name: string; credits: number; priceArs: number;
  pricePerCredit: number | null; active: boolean; visibleToClients: boolean;
  isCustom: boolean; sortOrder: number; _count: { creditPurchase: number };
}

function fmt(n: number) { return n.toLocaleString("es-AR"); }
function ars(n: number) { return `$${fmt(Math.round(n))}`; }

const EMPTY_FORM = {
  name: "", credits: "", priceArs: "", pricePerCredit: "",
  isCustom: false, sortOrder: "", visibleToClients: true,
};

export default function CreditsAdminPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<CreditPackage | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  function load() {
    setLoading(true);
    fetch("/api/superadmin/credit-packages")
      .then((r) => r.json())
      .then((d) => { setPackages(d.packages ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(pkg: CreditPackage) {
    setEditing(pkg);
    setForm({
      name:            pkg.name,
      credits:         String(pkg.credits),
      priceArs:        String(pkg.priceArs),
      pricePerCredit:  pkg.pricePerCredit != null ? String(pkg.pricePerCredit) : "",
      isCustom:        pkg.isCustom,
      sortOrder:       String(pkg.sortOrder),
      visibleToClients: pkg.visibleToClients,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setError("");
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.isCustom && (!form.credits || parseFloat(form.priceArs) <= 0)) {
      setError("Completá créditos y precio."); return;
    }

    setSaving(true);
    try {
      const url    = editing ? `/api/superadmin/credit-packages/${editing.id}` : "/api/superadmin/credit-packages";
      const method = editing ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      setSuccess(editing ? "Paquete actualizado" : "Paquete creado");
      setShowModal(false);
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pkg: CreditPackage) {
    await fetch(`/api/superadmin/credit-packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !pkg.active }),
    });
    load();
  }

  async function toggleVisible(pkg: CreditPackage) {
    await fetch(`/api/superadmin/credit-packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleToClients: !pkg.visibleToClients }),
    });
    load();
  }

  async function deactivate(pkg: CreditPackage) {
    if (!confirm(`¿Desactivar el paquete "${pkg.name}"? Las compras antiguas no se afectan.`)) return;
    await fetch(`/api/superadmin/credit-packages/${pkg.id}`, { method: "DELETE" });
    load();
  }

  const customPkg = packages.find((p) => p.isCustom);
  const regularPkgs = packages.filter((p) => !p.isCustom);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Créditos y precios</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Configurá los paquetes que ven los clientes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo paquete
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-neon-green/20 bg-neon-green/5 px-4 py-3">
          <CheckCircle className="h-4 w-4 text-neon-green" />
          <p className="text-sm text-neon-green">{success}</p>
        </div>
      )}

      {/* Custom amount config */}
      {customPkg && (
        <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-neon-cyan" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">Monto personalizado</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Precio por crédito: <strong className="text-neon-cyan">{ars(customPkg.pricePerCredit ?? 100)}</strong>
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => openEdit(customPkg)}>
              <Pencil className="h-4 w-4" />
              Editar precio
            </Button>
          </div>
        </div>
      )}

      {/* Packages table */}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border bg-brand-surface flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Paquetes de créditos</h2>
          <p className="text-xs text-[var(--text-secondary)]">{regularPkgs.length} paquetes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface/50">
                {["Nombre", "Créditos", "Precio ARS", "$/créd.", "Compras", "Estado", "Visible", "Orden", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-brand-surface animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : regularPkgs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[var(--text-secondary)]">Sin paquetes</td>
                </tr>
              ) : regularPkgs.map((pkg) => (
                <tr key={pkg.id} className="border-b border-brand-border/40 hover:bg-brand-surface transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{pkg.name}</td>
                  <td className="px-4 py-3 text-neon-cyan font-semibold">{fmt(pkg.credits)}</td>
                  <td className="px-4 py-3 text-neon-green font-semibold">{ars(pkg.priceArs)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {ars(pkg.credits > 0 ? pkg.priceArs / pkg.credits : 0)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{pkg._count.creditPurchase}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        pkg.active
                          ? "text-neon-green bg-neon-green/10 border-neon-green/20"
                          : "text-[var(--text-secondary)] bg-brand-surface border-brand-border"
                      }`}
                    >
                      {pkg.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVisible(pkg)} className="text-[var(--text-secondary)] hover:text-neon-cyan transition-colors">
                      {pkg.visibleToClients ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{pkg.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:border-neon-purple/30 hover:text-neon-purple transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deactivate(pkg)} className="p-1.5 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:border-neon-red/30 hover:text-neon-red transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-bg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5">
              {editing ? "Editar paquete" : "Nuevo paquete"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                  placeholder="Ej: Paquete Básico"
                />
              </div>

              {!form.isCustom && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Créditos</label>
                    <input
                      type="number"
                      value={form.credits}
                      onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                      placeholder="Ej: 100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Precio ARS</label>
                    <input
                      type="number"
                      value={form.priceArs}
                      onChange={(e) => setForm((f) => ({ ...f, priceArs: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                      placeholder="Ej: 9000"
                    />
                  </div>
                </div>
              )}

              {form.isCustom && (
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Precio por crédito (ARS)</label>
                  <input
                    type="number"
                    value={form.pricePerCredit}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerCredit: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                    placeholder="Ej: 100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Orden</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                    placeholder="1"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.visibleToClients}
                      onChange={(e) => setForm((f) => ({ ...f, visibleToClients: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">Visible a clientes</span>
                  </label>
                </div>
              </div>

              {form.credits && form.priceArs && !form.isCustom && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Precio por crédito: <strong className="text-neon-cyan">
                    ${(parseFloat(form.priceArs) / parseFloat(form.credits)).toFixed(0)} ARS
                  </strong>
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-neon-red/10 border border-neon-red/20 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-neon-red shrink-0" />
                  <p className="text-xs text-neon-red">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear paquete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
