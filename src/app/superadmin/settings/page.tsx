"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, User, Lock, Check, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();

  const [profile, setProfile]   = useState({ name: "", email: "" });
  const [pwForm, setPwForm]      = useState({ current: "", newPw: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);
  const [profileMsg, setProfileMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg]                 = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setProfile({ name: session.user.name ?? "", email: session.user.email ?? "" });
    }
  }, [session]);

  const showMsg = (
    set: (v: { ok: boolean; text: string } | null) => void,
    ok: boolean,
    text: string,
  ) => {
    set({ ok, text });
    setTimeout(() => set(null), 4000);
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      showMsg(setProfileMsg, false, "Nombre y email son requeridos");
      return;
    }
    setSavingProfile(true);
    try {
      const res  = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(setProfileMsg, false, data.error ?? "Error al guardar"); return; }
      await update({ name: data.name, email: data.email });
      showMsg(setProfileMsg, true, "Datos actualizados correctamente");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwSave = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      showMsg(setPwMsg, false, "Completá todos los campos");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showMsg(setPwMsg, false, "Las contraseñas no coinciden");
      return;
    }
    if (pwForm.newPw.length < 8) {
      showMsg(setPwMsg, false, "La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPw(true);
    try {
      const res  = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(setPwMsg, false, data.error ?? "Error al actualizar"); return; }
      setPwForm({ current: "", newPw: "", confirm: "" });
      showMsg(setPwMsg, true, "Contraseña actualizada correctamente");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configuración</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Administrá tu cuenta de superadmin</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <User className="h-4 w-4 text-neon-purple" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Datos de la cuenta</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nombre</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-bg border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50 transition-colors"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-bg border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50 transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
              profileMsg.ok
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {profileMsg.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              {savingProfile ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* Password card */}
      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <Lock className="h-4 w-4 text-neon-purple" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Cambiar contraseña</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Contraseña actual</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-bg border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-bg border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50 transition-colors"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-bg border border-brand-border text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-purple/50 transition-colors"
              placeholder="Repetí la nueva contraseña"
            />
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
              pwMsg.ok
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {pwMsg.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {pwMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handlePwSave}
              disabled={savingPw}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-medium hover:bg-neon-purple/25 transition-all disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {savingPw ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
