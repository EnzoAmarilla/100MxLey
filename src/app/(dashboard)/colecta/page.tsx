"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, MapPin, Package, Calendar, Clock, CheckSquare, Send, ChevronRight, Lock,
} from "lucide-react";

const PACKAGE_SIZES = [
  { value: "pequeño",  label: "Pequeño",  desc: "Cabe en una mochila" },
  { value: "mediano",  label: "Mediano",  desc: "Caja estándar e-commerce" },
  { value: "grande",   label: "Grande",   desc: "Caja grande / voluminoso" },
  { value: "mixto",    label: "Mixto",    desc: "Combinación de tamaños" },
];

const TIME_SLOTS = [
  { value: "mañana",          label: "Mañana",         desc: "8:00 - 13:00" },
  { value: "tarde",           label: "Tarde",           desc: "13:00 - 20:00" },
  { value: "horario_completo", label: "Horario completo", desc: "Flexible todo el día" },
];

const SHIPPING_TYPES = [
  { value: "andreani",          label: "Andreani" },
  { value: "correo_argentino",  label: "Correo Argentino" },
  { value: "uber_moto",         label: "Uber / Moto mensajero" },
  { value: "otro",              label: "Otro / A definir" },
];

interface FormData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  packageCount: string;
  packageSize: string;
  estimatedWeight: string;
  preferredDate: string;
  preferredTimeSlot: string;
  shippingType: string;
  observations: string;
  needsPackagingHelp: boolean;
  alreadyLabeled: boolean;
  hasFulfillmentProducts: boolean;
  needsQuote: boolean;
}

const INITIAL: FormData = {
  address: "", city: "", province: "", postalCode: "",
  packageCount: "", packageSize: "", estimatedWeight: "",
  preferredDate: "", preferredTimeSlot: "", shippingType: "",
  observations: "", needsPackagingHelp: false, alreadyLabeled: false,
  hasFulfillmentProducts: false, needsQuote: false,
};

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="h-7 w-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-neon-cyan" />
      </div>
      <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide uppercase">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 tracking-wide">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text", required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3.5 py-2.5 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-colors"
    />
  );
}

export default function ColectaPage() {
  const router  = useRouter();
  const [form, setForm]       = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/client/access")
      .then((r) => r.json())
      .then((d) => setHasAccess(d.logisticsEnabled ?? false))
      .catch(() => setHasAccess(false));
  }, []);

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, packageCount: Number(form.packageCount) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al enviar");
      }
      showToast("success", "Tu solicitud de colecta fue enviada correctamente. El equipo logístico se comunicará con vos.");
      setForm(INITIAL);
      setTimeout(() => router.push("/mis-colectas"), 2500);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (hasAccess === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-brand-surface animate-pulse border border-brand-border" />
        ))}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-[var(--text-secondary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Acceso pendiente de habilitación</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
          Esta sección será habilitada por el equipo de 100Mxley cuando tu cuenta esté lista para operar con logística.
        </p>
        <a
          href="mailto:soporte@100mxley.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all"
        >
          Solicitar habilitación
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm rounded-xl border px-5 py-4 shadow-2xl transition-all ${
          toast.type === "success"
            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
            : "bg-neon-red/10 border-neon-red/30 text-neon-red"
        }`}>
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-5 w-5 text-neon-cyan" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Solicitar colecta</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Solicitá un retiro de paquetes para coordinar con el equipo logístico.
          </p>
        </div>
        <button
          onClick={() => router.push("/mis-colectas")}
          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-neon-cyan transition-colors"
        >
          Ver mis colectas <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dirección */}
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 shadow-card">
          <SectionTitle icon={MapPin} title="Dirección de retiro" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Dirección *</FieldLabel>
              <Input value={form.address} onChange={(v) => set("address", v)} placeholder="Ej: Av. Corrientes 1234, Piso 3" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Ciudad *</FieldLabel>
                <Input value={form.city} onChange={(v) => set("city", v)} placeholder="Ej: Buenos Aires" required />
              </div>
              <div>
                <FieldLabel>Provincia *</FieldLabel>
                <Input value={form.province} onChange={(v) => set("province", v)} placeholder="Ej: CABA" required />
              </div>
            </div>
            <div className="max-w-xs">
              <FieldLabel>Código postal *</FieldLabel>
              <Input value={form.postalCode} onChange={(v) => set("postalCode", v)} placeholder="Ej: 1043" required />
            </div>
          </div>
        </div>

        {/* Paquetes */}
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 shadow-card">
          <SectionTitle icon={Package} title="Detalle de paquetes" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Cantidad aproximada de paquetes *</FieldLabel>
                <Input type="number" value={form.packageCount} onChange={(v) => set("packageCount", v)} placeholder="Ej: 15" required />
              </div>
              <div>
                <FieldLabel>Peso estimado (opcional)</FieldLabel>
                <Input value={form.estimatedWeight} onChange={(v) => set("estimatedWeight", v)} placeholder="Ej: 20 kg total" />
              </div>
            </div>

            <div>
              <FieldLabel>Tamaño aproximado *</FieldLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {PACKAGE_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("packageSize", s.value)}
                    className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                      form.packageSize === s.value
                        ? "bg-neon-cyan/10 border-neon-cyan/40 shadow-[inset_0_0_12px_rgba(0,245,255,0.05)]"
                        : "bg-brand-surface border-brand-border hover:border-neon-cyan/20 hover:bg-brand-surface/80"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${form.packageSize === s.value ? "text-neon-cyan" : "text-[var(--text-primary)]"}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fecha y logística */}
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 shadow-card">
          <SectionTitle icon={Calendar} title="Fecha y logística" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Fecha deseada de retiro *</FieldLabel>
              <Input
                type="date"
                value={form.preferredDate}
                onChange={(v) => set("preferredDate", v)}
                required
              />
            </div>

            <div>
              <FieldLabel>Franja horaria *</FieldLabel>
              <div className="grid grid-cols-3 gap-2.5">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("preferredTimeSlot", t.value)}
                    className={`flex flex-col items-center py-3 px-2 rounded-lg border text-center transition-all ${
                      form.preferredTimeSlot === t.value
                        ? "bg-neon-cyan/10 border-neon-cyan/40"
                        : "bg-brand-surface border-brand-border hover:border-neon-cyan/20"
                    }`}
                  >
                    <Clock className={`h-4 w-4 mb-1 ${form.preferredTimeSlot === t.value ? "text-neon-cyan" : "text-[var(--text-secondary)]"}`} />
                    <span className={`text-xs font-semibold ${form.preferredTimeSlot === t.value ? "text-neon-cyan" : "text-[var(--text-primary)]"}`}>
                      {t.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Tipo de envío *</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {SHIPPING_TYPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("shippingType", s.value)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                      form.shippingType === s.value
                        ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan"
                        : "bg-brand-surface border-brand-border text-[var(--text-primary)] hover:border-neon-cyan/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones y checkboxes */}
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 shadow-card">
          <SectionTitle icon={CheckSquare} title="Opciones adicionales" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Observaciones / comentario</FieldLabel>
              <textarea
                value={form.observations}
                onChange={(e) => set("observations", e.target.value)}
                placeholder="Cualquier detalle adicional que ayude al equipo logístico..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-surface border border-brand-border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-colors resize-none"
              />
            </div>

            <div className="space-y-2.5">
              {[
                { key: "needsPackagingHelp",     label: "Necesito ayuda para preparar los paquetes" },
                { key: "alreadyLabeled",          label: "Los paquetes ya están etiquetados" },
                { key: "hasFulfillmentProducts",  label: "Tengo productos fulfillment" },
                { key: "needsQuote",              label: "Necesito cotización" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => set(key as keyof FormData, !form[key as keyof FormData])}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      form[key as keyof FormData]
                        ? "bg-neon-cyan/20 border-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.3)]"
                        : "border-brand-border group-hover:border-neon-cyan/30"
                    }`}
                  >
                    {form[key as keyof FormData] && (
                      <div className="h-2.5 w-2.5 rounded-sm bg-neon-cyan" />
                    )}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !form.address || !form.city || !form.province || !form.postalCode || !form.packageCount || !form.packageSize || !form.preferredDate || !form.preferredTimeSlot || !form.shippingType}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan font-semibold text-sm hover:bg-neon-cyan/25 hover:border-neon-cyan/60 hover:shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-neon-cyan/40 border-t-neon-cyan rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Solicitar colecta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
