"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Truck, FileDown, CheckSquare, Square, AlertCircle,
  CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  Package, ShieldAlert, Info, Lock
} from "lucide-react";
import { CORREO_MAX_PER_FILE, type ValidationError } from "@/lib/logistics-export";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";

// ── Types ────────────────────────────────────────────────────────────────────

type Provider     = "andreani" | "correo_argentino" | "";
type AndreaniType = "domicilio" | "sucursal" | "";

interface Order {
  id:                 string;
  externalId:         string;
  buyerName:          string;
  buyerEmail:         string;
  address:            any;
  products:           any;
  status:             string;
  totalAmount:        number;
  createdAt:          string;
  shippingOptionName: string | null;
  trackingCode:       string | null;
  trackingUrl?:       string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const getToday = () => new Date();

function parseProducts(productsStr: any): any[] {
  if (!productsStr) return [];
  if (typeof productsStr === "string") {
    try {
      return JSON.parse(productsStr);
    } catch {
      return [];
    }
  }
  if (Array.isArray(productsStr)) return productsStr;
  return [];
}

function parseAddress(addr: unknown): string {
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr ?? {};
    const parts = [a.city || a.locality, a.province, a.zipcode || a.zip].filter(Boolean);
    return parts.join(", ");
  } catch {
    return "—";
  }
}

function hasFullAddress(addr: unknown): boolean {
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr ?? {};
    return !!(a.street && a.number && (a.city || a.locality) && a.province && (a.zipcode || a.zip));
  } catch { return false; }
}

function matchesProvider(
  shippingOptionName: string | null | undefined,
  addr: unknown,
  provider: Provider,
  andreaniType: AndreaniType,
): boolean {
  if (!provider) return true;
  const name = (shippingOptionName ?? "").toLowerCase().trim();
  if (provider === "andreani") {
    if (!andreaniType) return false;
    if (!name) return andreaniType === "sucursal" ? true : hasFullAddress(addr);
    const isSucursal = name.includes("sucursal") || name.includes("retiro") || name.includes("punto");
    if (andreaniType === "sucursal") return isSucursal;
    return !isSucursal && name.includes("andreani");
  }
  if (provider === "correo_argentino") {
    if (!name) return hasFullAddress(addr);
    return name.includes("correo");
  }
  return true;
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LogisticsExportPage() {
  // Access state
  const [hasRequested, setHasRequested] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/client/access")
      .then((r) => r.json())
      .then((d) => {
        setHasAccess(d.logisticsEnabled ?? false);
        setHasRequested(d.logisticsRequested ?? false);
        setIsDenied(d.logisticsDenied ?? false);
      })
      .catch(() => setHasAccess(false));
  }, []);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await fetch("/api/client/request-logistics", { method: "POST" });
      setHasRequested(true);
      setIsDenied(false);
    } catch (error) {
      console.error(error);
    } finally {
      setRequesting(false);
    }
  };

  // Orders state
  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [status,   setStatus]   = useState("");
  const [dateFrom, setDateFrom] = useState(() => fmt(getToday()));
  const [dateTo,   setDateTo]   = useState(() => fmt(getToday()));
  const [search,   setSearch]   = useState("");
  
  // Viewing Order
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Provider config
  const [provider,     setProvider]     = useState<Provider>("");
  const [andreaniType, setAndreaniType] = useState<AndreaniType>("");
  const isStep1Complete = provider === "correo_argentino" || (provider === "andreani" && andreaniType !== "");
  const [isPending, startTransition] = useTransition();

  const handleProviderSelect = (p: Provider) => {
    startTransition(() => {
      setProvider(p);
      if (p !== "andreani") setAndreaniType("");
    });
  };

  const handleAndreaniTypeSelect = (t: AndreaniType) => {
    startTransition(() => {
      setAndreaniType(t);
    });
  };

  // Validation + export state
  const [validating,        setValidating]        = useState(false);
  const [exporting,         setExporting]          = useState(false);
  const [validationErrors,  setValidationErrors]   = useState<ValidationError[] | null>(null);
  const [validationPassed,  setValidationPassed]   = useState(false);
  const [exportMsg,         setExportMsg]          = useState<{ ok: boolean; text: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 50;

  // ── Fetch orders ─────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (p = 0) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: String(p) });
    if (status)   params.set("status",   status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);

    try {
      const res  = await fetch(`/api/orders?${params}`, { signal: abortRef.current.signal });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total   ?? 0);
      setPage(p);
      setSelected(new Set()); // reset selection on filter change
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo]);

  useEffect(() => { 
    if (isStep1Complete) {
      fetchOrders(0); 
    } else {
      setOrders([]);
      setTotal(0);
      setPage(0);
      setSelected(new Set());
    }
  }, [fetchOrders, isStep1Complete]);

  // Reset validation when selection or provider changes
  useEffect(() => {
    setValidationErrors(null);
    setValidationPassed(false);
    setExportMsg(null);
  }, [selected, provider, andreaniType]);

  // ── Selection helpers ─────────────────────────────────────────────────────

  const toggleAll = () => {
    if (selected.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  // ── Validate ──────────────────────────────────────────────────────────────

  const handleValidate = async () => {
    if (!selected.size || !provider) return;
    setValidating(true);
    setValidationErrors(null);
    setValidationPassed(false);
    setExportMsg(null);

    try {
      const res  = await fetch("/api/orders/logistics-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds:    Array.from(selected),
          provider,
          shippingType: provider === "andreani" ? andreaniType : null,
          validateOnly: true,
        }),
      });
      const data = await res.json();
      const errors: ValidationError[] = data.validationErrors ?? [];
      setValidationErrors(errors);
      setValidationPassed(errors.length === 0);
    } catch {
      setExportMsg({ ok: false, text: "Error de conexión al validar." });
    } finally {
      setValidating(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!selected.size || !provider) return;
    setExporting(true);
    setExportMsg(null);

    try {
      const res  = await fetch("/api/orders/logistics-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds:    Array.from(selected),
          provider,
          shippingType: provider === "andreani" ? andreaniType : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors?.length) {
          setValidationErrors(data.validationErrors);
          setValidationPassed(false);
        }
        setExportMsg({ ok: false, text: data.error || "Error al exportar" });
        return;
      }

      const files: { filename: string; content: string }[] = data.files ?? [];
      files.forEach((file, i) => {
        setTimeout(() => downloadCSV(file.filename, file.content), i * 400);
      });

      const label = provider === "andreani"
        ? `Andreani (${andreaniType})`
        : "Correo Argentino";
      setExportMsg({
        ok:   true,
        text: `${data.exportedCount} pedidos exportados para ${label}. ${files.length > 1 ? `${files.length} archivos descargados.` : ""}`,
      });
    } catch {
      setExportMsg({ ok: false, text: "Error de conexión al exportar." });
    } finally {
      setExporting(false);
    }
  };

  // ── Date preset helpers ───────────────────────────────────────────────────

  const applyPreset = (id: string) => {
    const today = getToday();
    if (id === "today") { setDateFrom(fmt(today)); setDateTo(fmt(today)); return; }
    const f = new Date(today);
    if (id === "7d")  f.setDate(f.getDate() - 7);
    if (id === "14d") f.setDate(f.getDate() - 14);
    if (id === "30d") f.setDate(f.getDate() - 30);
    if (id === "all") { setDateFrom(""); setDateTo(""); return; }
    setDateFrom(fmt(f)); setDateTo(fmt(today));
  };

  const isActivePreset = (id: string) => {
    const today = getToday();
    const t = fmt(today);
    if (id === "today") return dateFrom === t && dateTo === t;
    if (id === "all") return dateFrom === "" && dateTo === "";
    
    const f = new Date(today);
    if (id === "7d")  f.setDate(f.getDate() - 7);
    if (id === "14d") f.setDate(f.getDate() - 14);
    if (id === "30d") f.setDate(f.getDate() - 30);
    
    return dateFrom === fmt(f) && dateTo === t;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredOrders = orders.filter((o) =>
    matchesProvider(o.shippingOptionName, o.address, provider, andreaniType)
  );
  const hiddenCount = orders.length - filteredOrders.length;

  const canValidate = selected.size > 0 && isStep1Complete;
  const canExport   = canValidate && validationPassed;

  // ── Render ────────────────────────────────────────────────────────────────

  if (hasAccess === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-brand-surface animate-pulse border border-brand-border" />
        ))}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className={`h-16 w-16 rounded-2xl border flex items-center justify-center mb-6 ${
          isDenied ? "bg-red-500/10 border-red-500/20" : "bg-brand-surface border-brand-border"
        }`}>
          <Lock className={`h-8 w-8 ${isDenied ? "text-red-400" : "text-[var(--text-secondary)]"}`} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          {isDenied ? "Solicitud rechazada" : hasRequested ? "Solicitud enviada" : "Acceso pendiente de habilitación"}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
          {isDenied
            ? "Tu solicitud no fue aprobada en este momento. Podés volver a solicitarla cuando estés listo."
            : hasRequested
            ? "Tu solicitud está siendo procesada por nuestro equipo. Te avisaremos cuando esté lista."
            : "Esta sección será habilitada por el equipo de 100Mxley cuando tu cuenta esté lista para operar con logística."}
        </p>
        {!hasRequested && (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all ${
              isDenied
                ? "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20"
                : "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20"
            }`}
          >
            {requesting ? "Enviando…" : isDenied ? "Volver a solicitar" : "Solicitar habilitación"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Truck className="h-8 w-8 text-neon-cyan" />
          Exportación Logística
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Generá archivos CSV listos para carga masiva en Andreani o Correo Argentino.
        </p>
      </div>

      {/* Export result banner */}
      {exportMsg && (
        <div className={[
          "rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between",
          exportMsg.ok
            ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
            : "bg-neon-red/10  border border-neon-red/30  text-neon-red",
        ].join(" ")}>
          {exportMsg.text}
          <button onClick={() => setExportMsg(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* ── PASO 1: Logística ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-brand-border bg-brand-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">1</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Elegí la logística</h2>
        </div>

        {/* Provider cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { id: "andreani",        label: "Andreani",         sub: "Domicilio o sucursal" },
            { id: "correo_argentino", label: "Correo Argentino", sub: `Máx. ${CORREO_MAX_PER_FILE} pedidos por archivo` },
          ] as const).map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderSelect(p.id)}
              className={[
                "relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                provider === p.id
                  ? "border-neon-cyan/50 bg-neon-cyan/5 shadow-[0_0_16px_rgba(0,245,255,0.08)]"
                  : "border-brand-border bg-brand-surface/50 hover:border-neon-cyan/25 hover:bg-brand-surface",
              ].join(" ")}
            >
              {provider === p.id && (
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-neon-cyan" />
              )}
              <Truck className={`h-5 w-5 mt-0.5 shrink-0 ${provider === p.id ? "text-neon-cyan" : "text-[var(--text-secondary)]"}`} />
              <div>
                <p className={`text-sm font-semibold ${provider === p.id ? "text-neon-cyan" : "text-[var(--text-primary)]"}`}>{p.label}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Andreani type selector */}
        {provider === "andreani" && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Tipo de envío</p>
            <div className="flex gap-3">
              {(["domicilio", "sucursal"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleAndreaniTypeSelect(t)}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                    andreaniType === t
                      ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan"
                      : "bg-brand-surface border-brand-border text-[var(--text-secondary)] hover:border-neon-cyan/25",
                  ].join(" ")}
                >
                  {t === "domicilio" ? "Envío a domicilio" : "Envío a sucursal"}
                </button>
              ))}
            </div>

            {/* Los inputs de sucursal manuales han sido eliminados para permitir exportar todas las sucursales juntas */}
          </div>
        )}

        {/* Correo Argentino info */}
        {provider === "correo_argentino" && (
          <div className="flex items-start gap-2 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20 px-3 py-2.5">
            <Info className="h-4 w-4 text-neon-yellow shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-secondary)]">
              Correo Argentino permite máximo <span className="text-neon-yellow font-medium">{CORREO_MAX_PER_FILE} envíos por archivo</span>.
              Si seleccionás más, el sistema generará múltiples archivos automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* ── PASO 2: Seleccioná pedidos ─────────────────────────────────── */}
      <div className={`rounded-xl border border-brand-border bg-brand-card p-6 space-y-5 transition-opacity duration-300 ${!isStep1Complete ? "opacity-50 pointer-events-none select-none" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">2</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Seleccioná los pedidos</h2>
          <div className="ml-auto flex items-center gap-2">
            {hiddenCount > 0 && (
              <span className="text-xs text-neon-yellow/80 bg-neon-yellow/5 border border-neon-yellow/20 px-2.5 py-0.5 rounded-full">
                {hiddenCount} oculto{hiddenCount !== 1 ? "s" : ""} (otro tipo de envío)
              </span>
            )}
            {selected.size > 0 && (
              <span className="text-xs font-semibold text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30 px-2.5 py-0.5 rounded-full">
                {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Date presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Período:</span>
            {(["today","7d","14d","30d","all"] as const).map((id) => (
              <button
                key={id}
                onClick={() => applyPreset(id)}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  isActivePreset(id)
                    ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan"
                    : "border-brand-border bg-brand-surface/50 text-[var(--text-secondary)] hover:border-neon-cyan/30 hover:text-[var(--text-primary)]"
                ].join(" ")}
              >
                {{ today:"Hoy", "7d":"7 días", "14d":"2 semanas", "30d":"1 mes", all:"Todos" }[id]}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 h-7 text-xs" />
              <span className="text-[var(--text-secondary)] text-xs">–</span>
              <Input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className="w-36 h-7 text-xs" />
            </div>
          </div>

          {/* Status + search */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-brand-accent focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Por cobrar</option>
              <option value="paid">Por empaquetar</option>
              <option value="ready_to_ship">Por enviar</option>
              <option value="shipped">En camino</option>
              <option value="delivered">Entregado</option>
            </select>
          </div>
        </div>

        {/* Orders table */}
        <div className="overflow-x-auto rounded-xl border border-brand-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface/80">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} disabled={loading || isPending}>
                    {selected.size === filteredOrders.length && filteredOrders.length > 0 && !loading && !isPending
                      ? <CheckSquare className="h-4 w-4 text-neon-cyan" />
                      : <Square className="h-4 w-4 text-[var(--text-secondary)]" />}
                  </button>
                </th>
                {["# Pedido","Fecha","Comprador","SKU","Dirección","Seguimiento","Envío","Estado","Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isStep1Complete ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-[var(--text-secondary)]">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="h-8 w-8 opacity-20" />
                      <span>Seleccioná una logística en el paso 1 para cargar los pedidos</span>
                    </div>
                  </td>
                </tr>
              ) : loading || isPending ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-[var(--text-secondary)]">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando pedidos...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-[var(--text-secondary)]">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <span>{orders.length > 0 ? "Ningún pedido tiene dirección completa para este tipo de envío" : "No hay pedidos para mostrar"}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => toggle(order.id)}
                    className="border-b border-brand-border hover:bg-brand-surface/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggle(order.id)}>
                        {selected.has(order.id)
                          ? <CheckSquare className="h-4 w-4 text-neon-cyan" />
                          : <Square className="h-4 w-4 text-[var(--text-secondary)]" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-neon-cyan/90 text-xs">#{order.externalId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{fmtDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)] text-sm">{order.buyerName}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{order.buyerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {(() => {
                        const skus = parseProducts(order.products).map((p: any) => p.sku).filter(Boolean);
                        if (skus.length === 0) return "—";
                        if (skus.length === 1) {
                          return (
                            <span 
                              className="font-mono text-neon-cyan/90 bg-brand-surface/50 border border-brand-border px-1.5 py-0.5 rounded truncate max-w-[8rem] inline-block"
                              title={skus[0]}
                            >
                              {skus[0]}
                            </span>
                          );
                        }
                        return (
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer group"
                            title={skus.join(", ")}
                            onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                          >
                            <span className="font-mono text-neon-cyan/90 bg-brand-surface/50 border border-brand-border px-1.5 py-0.5 rounded truncate max-w-[6rem] transition-colors group-hover:border-neon-cyan/50">
                              {skus[0]}
                            </span>
                            <span className="text-[10px] text-neon-cyan/80 border-b border-dashed border-neon-cyan/50 transition-colors group-hover:text-neon-cyan whitespace-nowrap">
                              +{skus.length - 1} más
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{parseAddress(order.address)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-[8rem]">
                      {order.trackingCode ? (
                        <a
                          href={order.trackingUrl || `https://www.google.com/search?q=${order.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-neon-cyan hover:underline truncate block"
                          title={`Seguimiento: ${order.trackingCode}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{order.trackingCode}
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-[11rem]">
                      <span className="block truncate" title={order.shippingOptionName ?? undefined}>{order.shippingOptionName ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === "ready_to_ship" && <Badge variant="cyan">Por enviar</Badge>}
                      {order.status === "paid"          && <Badge variant="yellow">Empaquetado</Badge>}
                      {order.status === "shipped"       && <Badge variant="purple">En camino</Badge>}
                      {order.status === "delivered"     && <Badge variant="green">Entregado</Badge>}
                      {order.status === "pending"       && <Badge variant="default">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)] text-sm">
                      ${order.totalAmount?.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[var(--text-secondary)]">
              Página {page + 1} de {totalPages} · {total} pedidos
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => fetchOrders(page - 1)} className="h-8">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => fetchOrders(page + 1)} className="h-8">
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── PASO 3: Validar y exportar ─────────────────────────────────── */}
      <div className="rounded-xl border border-brand-border bg-brand-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">3</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Validar y exportar</h2>
        </div>

        {/* Summary */}
        {selected.size > 0 && provider && (
          <div className="rounded-lg bg-brand-surface/50 border border-brand-border px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-medium">{selected.size}</span> pedidos seleccionados →{" "}
            <span className="text-neon-cyan font-medium">
              {provider === "andreani"
                ? `Andreani (${andreaniType === "domicilio" ? "Domicilio" : "Sucursal"})`
                : "Correo Argentino"}
            </span>
            {provider === "correo_argentino" && selected.size > CORREO_MAX_PER_FILE && (
              <span className="text-neon-yellow ml-2 text-xs">
                → {Math.ceil(selected.size / CORREO_MAX_PER_FILE)} archivos de {CORREO_MAX_PER_FILE}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleValidate}
            disabled={!canValidate || validating}
            variant="secondary"
            className="gap-2"
          >
            {validating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</>
              : <><ShieldAlert className="h-4 w-4" /> Validar pedidos</>}
          </Button>

          <Button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className="gap-2"
          >
            {exporting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Exportando...</>
              : <><FileDown className="h-4 w-4" /> Exportar CSV</>}
          </Button>
        </div>

        {/* Validation: passed */}
        {validationPassed && validationErrors !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-neon-green/5 border border-neon-green/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-neon-green shrink-0" />
            <p className="text-sm text-neon-green font-medium">
              Todos los pedidos tienen datos completos. Podés exportar.
            </p>
          </div>
        )}

        {/* Validation: errors */}
        {validationErrors !== null && validationErrors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-neon-red/5 border border-neon-red/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-neon-red shrink-0" />
              <p className="text-sm text-neon-red font-medium">
                {validationErrors.length} pedido{validationErrors.length !== 1 ? "s" : ""} con datos incompletos. Corregí los errores antes de exportar.
              </p>
            </div>
            <div className="rounded-xl border border-brand-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-brand-surface/80 border-b border-brand-border">
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[var(--text-secondary)]">Pedido</th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[var(--text-secondary)]">Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {validationErrors.map((ve) => (
                    <tr key={ve.orderId} className="border-b border-brand-border">
                      <td className="px-4 py-2.5 font-mono text-neon-red/90">#{ve.orderNumber}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                        {ve.errors.join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Helper text when nothing selected */}
        {selected.size === 0 && (
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Seleccioná pedidos en el paso 2 y una logística en el paso 1 para continuar.
          </p>
        )}
      </div>

      <OrderDetailModal 
        order={viewingOrder} 
        isOpen={!!viewingOrder} 
        onClose={() => setViewingOrder(null)} 
      />
    </div>
  );
}
