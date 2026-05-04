"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, X, Check, ShieldAlert, Search } from "lucide-react";

interface AdminUser {
  id:          string;
  name:        string;
  email:       string;
  status:      string;
  createdAt:   string;
  lastLoginAt: string | null;
}

type ModalMode = "create" | "edit" | null;

const emptyForm = { name: "", email: "", password: "", status: "active" };

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState<ModalMode>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [toast, setToast]     = useState("");
  const [confirmDel, setConfirmDel] = useState<AdminUser | null>(null);

  const load = (q = search) => {
    setLoading(true);
    fetch(`/api/superadmin/admin-users?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModal("create");
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", status: u.status });
    setError("");
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); setError(""); };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nombre y email son requeridos");
      return;
    }
    if (modal === "create" && !form.password.trim()) {
      setError("La contraseña es requerida");
      return;
    }
    setSaving(true);
    try {
      const url    = modal === "edit" ? `/api/superadmin/admin-users/${editing!.id}` : "/api/superadmin/admin-users";
      const method = modal === "edit" ? "PATCH" : "POST";
      const body   = modal === "create"
        ? { name: form.name, email: form.email, password: form.password }
        : { name: form.name, email: form.email, status: form.status, ...(form.password ? { password: form.password } : {}) };

      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }

      closeModal();
      showToast(modal === "create" ? "Usuario creado correctamente" : "Usuario actualizado");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    const res = await fetch(`/api/superadmin/admin-users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Usuario eliminado");
      setConfirmDel(null);
      load();
    } else {
      const d = await res.json();
      showToast(d.error ?? "Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Usuarios internos</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Gestión del equipo de staff (rol ADMIN)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo staff
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
          placeholder="Buscar por nombre o email…"
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-neon-purple/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <UserCog className="h-8 w-8 mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
            <p className="text-sm text-[var(--text-secondary)]">No hay usuarios staff registrados.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Creado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Último acceso</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-neon-purple">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-zinc-700/30 text-zinc-400 border-zinc-600"
                    }`}>
                      {u.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                    {new Date(u.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("es-AR") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-neon-purple/10 text-[var(--text-secondary)] hover:text-neon-purple transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDel(u)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-bg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-neon-purple" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {modal === "create" ? "Nuevo usuario staff" : "Editar usuario"}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-brand-surface text-[var(--text-secondary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Nombre completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                  placeholder="Ej: Ana García"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                  placeholder="staff@100mxley.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {modal === "edit" ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              {modal === "edit" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg border border-brand-border text-sm text-[var(--text-secondary)] hover:bg-brand-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all disabled:opacity-50"
              >
                {saving ? "Guardando…" : <><Check className="h-4 w-4" /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-bg shadow-2xl px-6 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Eliminar usuario</p>
                <p className="text-xs text-[var(--text-secondary)]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Seguro que querés eliminar a <span className="font-medium text-[var(--text-primary)]">{confirmDel.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-brand-border text-sm text-[var(--text-secondary)] hover:bg-brand-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-brand-surface border border-neon-purple/30 text-sm text-[var(--text-primary)] shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-neon-purple" />
          {toast}
        </div>
      )}
    </div>
  );
}
