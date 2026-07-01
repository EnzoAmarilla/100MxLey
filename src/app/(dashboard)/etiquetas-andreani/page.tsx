"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, CheckCircle2, XCircle, Loader2,
  Package, RotateCcw, Tag,
} from "lucide-react";

interface Product {
  name:          string;
  sku:           string;
  quantity:      number;
  variantValues: string[];
}

interface FoundResult {
  filename:        string;
  status:          "found";
  extractedNumber: string;
  andreaniTracking?: string | null;
  order: {
    id:          string;
    orderNumber: string | number;
    buyerName:   string;
    products:    Product[];
  };
}

interface NotFoundResult {
  filename:        string;
  status:          "not_found" | "error";
  extractedNumber?: string;
  reason:          string;
}

type Result = FoundResult | NotFoundResult;

export default function EtiquetasAndreaniPage() {
  const [dragging,   setDragging]   = useState(false);
  const [files,      setFiles]      = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results,    setResults]    = useState<Result[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !names.has(f.name))];
    });
    setResults(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setResults(null);
  };

  const handleProcess = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults(null);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const res  = await fetch("/api/orders/upload-labels", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Error al procesar las etiquetas");
        return;
      }

      setResults(data.results ?? []);
    } catch {
      alert("Error de conexión");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults(null);
  };

  const found    = results?.filter((r) => r.status === "found").length ?? 0;
  const notFound = results?.filter((r) => r.status !== "found").length ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Tag className="h-8 w-8 text-neon-cyan" />
          Etiquetas Andreani
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Subí los PDFs de rótulos generados por Andreani. El sistema detecta el número de pedido
          automáticamente y lo deja listo para que el operario lo prepare.
        </p>
      </div>

      {/* Upload area */}
      {!results && (
        <div className="space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={[
              "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200",
              dragging
                ? "border-neon-cyan bg-neon-cyan/5"
                : "border-brand-border hover:border-neon-cyan/40 hover:bg-brand-surface/50",
            ].join(" ")}
          >
            <Upload className={`h-10 w-10 mx-auto mb-3 ${dragging ? "text-neon-cyan" : "text-[var(--text-secondary)]"}`} />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Arrastrá los PDFs acá o hacé click para seleccionar
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Solo archivos PDF</p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-brand-border bg-brand-surface/50"
                >
                  <FileText className="h-4 w-4 text-neon-cyan shrink-0" />
                  <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{f.name}</span>
                  <button
                    onClick={() => removeFile(f.name)}
                    className="text-[var(--text-secondary)] hover:text-neon-red transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-semibold text-sm hover:bg-neon-cyan/20 disabled:opacity-50 transition-all"
              >
                {processing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                  : <><Upload className="h-4 w-4" /> Procesar {files.length} etiqueta{files.length !== 1 ? "s" : ""}</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary bar */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              {found} encontrado{found !== 1 ? "s" : ""}
            </div>
            {notFound > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                <XCircle className="h-4 w-4" />
                {notFound} no resuelto{notFound !== 1 ? "s" : ""}
              </div>
            )}
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-brand-surface text-sm transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Subir más
            </button>
          </div>

          {found > 0 && (
            <p className="text-xs text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-4 py-2.5">
              Los pedidos encontrados quedaron marcados como <strong>listos para preparar</strong>.
              El operario podrá verlos en el panel de picking.
            </p>
          )}

          {/* Found orders */}
          {(results.filter((r) => r.status === "found") as FoundResult[]).map((r) => (
            <div key={r.filename} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.filename}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Pedido <span className="font-mono text-emerald-400">#{r.order.orderNumber}</span>
                    {" · "}{r.order.buyerName}
                    {r.andreaniTracking && (
                      <span className="ml-2 font-mono text-[10px] opacity-60">{r.andreaniTracking}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {r.order.products.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">Sin productos registrados</p>
                ) : r.order.products.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold flex items-center justify-center shrink-0">
                      {p.quantity}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{p.name}</span>
                    {p.sku && (
                      <span className="text-xs font-mono text-[var(--text-secondary)] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded">
                        {p.sku}
                      </span>
                    )}
                    {p.variantValues.length > 0 && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        — {p.variantValues.join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Not found / errors */}
          {(results.filter((r) => r.status !== "found") as NotFoundResult[]).map((r) => (
            <div key={r.filename} className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
              <XCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{r.filename}</p>
                {r.extractedNumber && (
                  <p className="text-xs text-[var(--text-secondary)]">Número detectado: {r.extractedNumber}</p>
                )}
                <p className="text-xs text-amber-400/80 mt-0.5">{r.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!results && files.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Package className="h-10 w-10 text-[var(--text-secondary)] opacity-30" />
          <p className="text-sm text-[var(--text-secondary)]">
            Todavía no subiste ningún archivo.
          </p>
        </div>
      )}
    </div>
  );
}
