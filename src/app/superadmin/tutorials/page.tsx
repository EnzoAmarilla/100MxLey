"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, X } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

type ModalMode = "create" | "edit" | null;

const EMPTY_FORM = { title: "", description: "", videoUrl: "", sortOrder: "0", active: true };

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function VideoPreview({ url }: { url: string }) {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
      <video src={url} controls className="w-full h-full" />
    </div>
  );
}

export default function SuperAdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<ModalMode>(null);
  const [editing, setEditing]     = useState<Tutorial | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [preview, setPreview]     = useState<Tutorial | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/superadmin/tutorials")
      .then((r) => r.json())
      .then((d) => setTutorials(d.tutorials ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (t: Tutorial) => {
    setForm({
      title: t.title,
      description: t.description ?? "",
      videoUrl: t.videoUrl,
      sortOrder: String(t.sortOrder),
      active: t.active,
    });
    setEditing(t);
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.videoUrl.trim()) {
      showToast("Completá el título y la URL del video", false);
      return;
    }
    setSaving(true);
    try {
      const body = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        videoUrl:    form.videoUrl.trim(),
        sortOrder:   Number(form.sortOrder) || 0,
        active:      form.active,
      };
      if (modal === "create") {
        const res = await fetch("/api/superadmin/tutorials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Error");
        showToast("Tutorial creado", true);
      } else if (editing) {
        const res = await fetch(`/api/superadmin/tutorials/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Error");
        showToast("Tutorial actualizado", true);
      }
      closeModal();
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tutorial?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/superadmin/tutorials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Tutorial eliminado", true);
      load();
    } catch {
      showToast("Error al eliminar", false);
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (t: Tutorial) => {
    try {
      await fetch(`/api/superadmin/tutorials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !t.active }),
      });
      load();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${
          toast.ok
            ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-300"
            : "bg-red-900/80 border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tutoriales</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Videos explicativos visibles para los clientes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all"
        >
          <Plus className="h-4 w-4" /> Nuevo tutorial
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando tutoriales…</div>
        ) : tutorials.length === 0 ? (
          <div className="p-12 text-center">
            <PlayCircle className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-500">No hay tutoriales cargados todavía.</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm hover:bg-neon-purple/20 transition-all">
              Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Orden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">URL del video</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {tutorials.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 text-zinc-500 text-xs">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-zinc-700" />
                      {t.sortOrder}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-zinc-200">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[240px]">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-zinc-400 font-mono truncate max-w-[200px] block">{t.videoUrl}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(t)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        t.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-zinc-700/30 text-zinc-500 border-zinc-700 hover:bg-zinc-700/50"
                      }`}
                    >
                      {t.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {t.active ? "Visible" : "Oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setPreview(t)}
                        className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-neon-purple hover:border-neon-purple/30 transition-all"
                        title="Vista previa"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-neon-purple hover:border-neon-purple/30 transition-all"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="p-1.5 rounded-lg bg-white/5 border border-zinc-700/50 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40"
                        title="Eliminar"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">
                {modal === "create" ? "Nuevo tutorial" : "Editar tutorial"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Título <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Cómo conectar Tiendanube"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-neon-purple/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción breve del contenido..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-neon-purple/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  URL del video <span className="text-red-400">*</span>
                  <span className="text-zinc-600 ml-1 font-normal">(YouTube, Loom, o URL directa)</span>
                </label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-neon-purple/50 font-mono"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Orden de aparición</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-neon-purple/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Visibilidad</label>
                  <select
                    value={form.active ? "active" : "hidden"}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "active" }))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-neon-purple/50"
                  >
                    <option value="active">Visible</option>
                    <option value="hidden">Oculto</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all disabled:opacity-40"
              >
                {saving ? "Guardando…" : modal === "create" ? "Crear tutorial" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">{preview.title}</h2>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <VideoPreview url={preview.videoUrl} />
              {preview.description && (
                <p className="mt-3 text-sm text-zinc-400">{preview.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
