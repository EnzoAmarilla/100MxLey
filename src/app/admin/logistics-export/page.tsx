"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminClient } from "@/contexts/admin-client";
import {
  Truck, FileDown, CheckSquare, Square, AlertCircle,
  CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  Package, ShieldAlert, Info, Users,
} from "lucide-react";
import { CORREO_MAX_PER_FILE, type ValidationError } from "@/lib/logistics-export";

type Provider     = "andreani" | "correo_argentino" | "";
type AndreaniType = "domicilio" | "sucursal";

interface Order {
  id:           string;
  externalId:   string;
  buyerName:    string;
  buyerEmail:   string;
  address:      any;
  status:       string;
  totalAmount:  number;
  createdAt:    string;
}

const pad    = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

function parseAddress(addr: unknown): string {
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr ?? {};
    return [a.city || a.locality, a.province, a.zipcode || a.zip].filter(Boolean).join(", ");
  } catch { return "—"; }
}

function hasFullAddress(addr: unknown): boolean {
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr ?? {};
    return !!(a.street && a.number && (a.city || a.locality) && a.province && (a.zipcode || a.zip));
  } catch { return false; }
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

export default function AdminLogisticsExportPage() {
  const { activeClient, hydrated } = useAdminClient();

  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(false);

  const [status,   setStatus]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [provider,     setProvider]     = useState<Provider>("");
  const [andreaniType, setAndreaniType] = useState<AndreaniType>("domicilio");
  const [branchCode,   setBranchCode]   = useState("");
  const [branchName,   setBranchName]   = useState("");

  const [validating,       setValidating]       = useState(false);
  const [exporting,        setExporting]         = useState(false);
  const [validationErrors, setValidationErrors]  = useState<ValidationError[] | null>(null);
  const [validationPassed, setValidationPassed]  = useState(false);
  const [exportMsg,        setExportMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 50;

  const fetchOrders = useCallback(async (p = 0) => {
    if (!activeClient) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ clientId: activeClient.id, page: String(p + 1), limit: String(PAGE_SIZE) });
    if (status) params.set("status", status);

    try {
      const res  = await fetch(`/api/admin/orders?${params}`, { signal: abortRef.current.signal });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total   ?? 0);
      setPage(p);
      setSelected(new Set());
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeClient, status]);

  useEffect(() => {
    if (activeClient) fetchOrders(0);
  }, [fetchOrders, activeClient]);

  useEffect(() => {
    setValidationErrors(null);
    setValidationPassed(false);
    setExportMsg(null);
  }, [selected, provider, andreaniType, branchCode, branchName]);

  const toggleAll = () => {
    if (selected.size === filteredOrders.length && filteredOrders.length > 0) setSelected(new Set());
    else setSelected(new Set(filteredOrders.map((o) => o.id)));
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleValidate = async () => {
    if (!selected.size || !provider || !activeClient) return;
    setValidating(true);
    setValidationErrors(null);
    setValidationPassed(false);

    try {
      const res  = await fetch("/api/admin/orders/logistics-export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          orderIds:     Array.from(selected),
          clientId:     activeClient.id,
          provider,
          shippingType: provider === "andreani" ? andreaniType : null,
          branchCode,
          branchName,
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

  const handleExport = async () => {
    if (!selected.size || !provider || !activeClient) return;
    setExporting(true);
    setExportMsg(null);

    try {
      const res  = await fetch("/api/admin/orders/logistics-export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          orderIds:     Array.from(selected),
          clientId:     activeClient.id,
          provider,
          shippingType: provider === "andreani" ? andreaniType : null,
          branchCode,
          branchName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors?.length) { setValidationErrors(data.validationErrors); setValidationPassed(false); }
        setExportMsg({ ok: false, text: data.error || "Error al exportar" });
        return;
      }

      const files: { filename: string; content: string }[] = data.files ?? [];
      files.forEach((file, i) => setTimeout(() => downloadCSV(file.filename, file.content), i * 400));

      const label = provider === "andreani" ? `Andreani (${andreaniType})` : "Correo Argentino";
      setExportMsg({ ok: true, text: `${data.exportedCount} pedidos exportados para ${label}.${files.length > 1 ? ` ${files.length} archivos.` : ""}` });
    } catch {
      setExportMsg({ ok: false, text: "Error de conexión al exportar." });
    } finally {
      setExporting(false);
    }
  };

  const today = new Date();
  const fmt   = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const applyPreset = (id: string) => {
    if (id === "all") { setDateFrom(""); setDateTo(""); return; }
    if (id === "today") { setDateFrom(fmt(today)); setDateTo(fmt(today)); return; }
    const f = new Date(today);
    if (id === "7d") f.setDate(f.getDate() - 7);
    if (id === "14d") f.setDate(f.getDate() - 14);
    if (id === "30d") f.setDate(f.getDate() - 30);
    setDateFrom(fmt(f)); setDateTo(fmt(today));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredOrders = orders.filter((o) => {
    if (!provider) return true;
    if (provider === "andreani" && andreaniType === "sucursal") return true;
    return hasFullAddress(o.address);
  });
  const hiddenCount = orders.length - filteredOrders.length;

  const canValidate = selected.size > 0 && !!provider && (provider !== "andreani" || !!andreaniType);
  const canExport   = canValidate && validationPassed;

  // Not hydrated yet
  if (!hydrated) return null;

  // No active client
  if (!activeClient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-[var(--text-secondary)]">
        <Users className="h-12 w-12 opacity-20" />
        <p className="text-lg font-medium">Seleccioná un cliente para continuar</p>
        <p className="text-sm">Usá la barra superior para elegir el cliente activo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Truck className="h-6 w-6 text-neon-cyan" />
            Exportación Logística
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Cliente: <span className="text-neon-cyan font-medium">{activeClient.name}</span>
          </p>
        </div>
      </div>

      {/* Export result banner */}
      {exportMsg && (
        <div className={["rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between",
          exportMsg.ok ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                       : "bg-neon-red/10 border border-neon-red/30 text-neon-red"].join(" ")}>
          {exportMsg.text}
          <button onClick={() => setExportMsg(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg">×</button>
        </div>
      )}

      {/* PASO 1 */}
      <div className="rounded-xl border border-brand-border bg-brand-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">1</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Logística</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { id: "andreani",         label: "Andreani",         sub: "Domicilio o sucursal" },
            { id: "correo_argentino", label: "Correo Argentino", sub: `Máx. ${CORREO_MAX_PER_FILE} pedidos por archivo` },
          ] as const).map((p) => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={["relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                provider === p.id
                  ? "border-neon-cyan/50 bg-neon-cyan/5"
                  : "border-brand-border bg-brand-surface/50 hover:border-neon-cyan/25"].join(" ")}>
              {provider === p.id && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-neon-cyan" />}
              <Truck className={`h-5 w-5 mt-0.5 shrink-0 ${provider === p.id ? "text-neon-cyan" : "text-[var(--text-secondary)]"}`} />
              <div>
                <p className={`text-sm font-semibold ${provider === p.id ? "text-neon-cyan" : "text-[var(--text-primary)]"}`}>{p.label}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {provider === "andreani" && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Tipo de envío</p>
            <div className="flex gap-3">
              {(["domicilio", "sucursal"] as const).map((t) => (
                <button key={t} onClick={() => setAndreaniType(t)}
                  className={["px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                    andreaniType === t
                      ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan"
                      : "bg-brand-surface border-brand-border text-[var(--text-secondary)] hover:border-neon-cyan/25"].join(" ")}>
                  {t === "domicilio" ? "Domicilio" : "Sucursal"}
                </button>
              ))}
            </div>
            {andreaniType === "sucursal" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)]">Código de sucursal *</label>
                  <Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="Ej: 1048" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)]">Nombre de sucursal</label>
                  <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Ej: Palermo Hollywood" className="h-9 text-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PASO 2 */}
      <div className="rounded-xl border border-brand-border bg-brand-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">2</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Pedidos</h2>
          <div className="ml-auto flex items-center gap-2">
            {hiddenCount > 0 && (
              <span className="text-xs text-neon-yellow/80 bg-neon-yellow/5 border border-neon-yellow/20 px-2.5 py-0.5 rounded-full">
                {hiddenCount} sin dirección oculto{hiddenCount !== 1 ? "s" : ""}
              </span>
            )}
            {selected.size > 0 && (
              <span className="text-xs font-semibold text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30 px-2.5 py-0.5 rounded-full">
                {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo_para_despachar">Listo para despachar</option>
            <option value="enviado">Enviado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-secondary)]">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando pedidos...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface/80">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll}>
                      {selected.size === filteredOrders.length && filteredOrders.length > 0
                        ? <CheckSquare className="h-4 w-4 text-neon-cyan" />
                        : <Square className="h-4 w-4 text-[var(--text-secondary)]" />}
                    </button>
                  </th>
                  {["# Pedido","Fecha","Comprador","Dirección","Estado","Total"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 opacity-20" />
                        <span>{orders.length > 0 ? "Ningún pedido tiene dirección completa para este tipo de envío" : "No hay pedidos para este cliente"}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.map((order) => (
                  <tr key={order.id} onClick={() => toggle(order.id)}
                    className="border-b border-brand-border hover:bg-brand-surface/40 cursor-pointer transition-colors">
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
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{parseAddress(order.address)}</td>
                    <td className="px-4 py-3">
                      {order.status === "ready_to_ship"       && <Badge variant="cyan">Por enviar</Badge>}
                      {order.status === "listo_para_despachar" && <Badge variant="cyan">Listo</Badge>}
                      {order.status === "paid"                && <Badge variant="yellow">Empaquetado</Badge>}
                      {order.status === "en_preparacion"      && <Badge variant="yellow">En prep.</Badge>}
                      {order.status === "shipped"             && <Badge variant="purple">En camino</Badge>}
                      {order.status === "enviado"             && <Badge variant="purple">Enviado</Badge>}
                      {order.status === "delivered"           && <Badge variant="green">Entregado</Badge>}
                      {order.status === "pendiente"           && <Badge variant="default">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)] text-sm">
                      ${order.totalAmount?.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[var(--text-secondary)]">Página {page + 1} de {totalPages}</p>
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

      {/* PASO 3 */}
      <div className="rounded-xl border border-brand-border bg-brand-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-[10px] font-bold text-neon-cyan">3</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Validar y exportar</h2>
        </div>

        {selected.size > 0 && provider && (
          <div className="rounded-lg bg-brand-surface/50 border border-brand-border px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-medium">{selected.size}</span> pedidos →{" "}
            <span className="text-neon-cyan font-medium">
              {provider === "andreani" ? `Andreani (${andreaniType})` : "Correo Argentino"}
            </span>
            {provider === "correo_argentino" && selected.size > CORREO_MAX_PER_FILE && (
              <span className="text-neon-yellow ml-2 text-xs">→ {Math.ceil(selected.size / CORREO_MAX_PER_FILE)} archivos</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleValidate} disabled={!canValidate || validating} variant="secondary" className="gap-2">
            {validating ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</> : <><ShieldAlert className="h-4 w-4" /> Validar</>}
          </Button>
          <Button onClick={handleExport} disabled={!canExport || exporting} className="gap-2">
            {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Exportando...</> : <><FileDown className="h-4 w-4" /> Exportar CSV</>}
          </Button>
        </div>

        {validationPassed && validationErrors !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-neon-green/5 border border-neon-green/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-neon-green shrink-0" />
            <p className="text-sm text-neon-green font-medium">Todos los pedidos tienen datos completos. Podés exportar.</p>
          </div>
        )}

        {validationErrors !== null && validationErrors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-neon-red/5 border border-neon-red/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-neon-red shrink-0" />
              <p className="text-sm text-neon-red font-medium">
                {validationErrors.length} pedido{validationErrors.length !== 1 ? "s" : ""} con datos incompletos.
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
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{ve.errors.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected.size === 0 && (
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Seleccioná pedidos y una logística para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
