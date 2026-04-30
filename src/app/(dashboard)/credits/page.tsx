"use client";

import { useEffect, useState, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Coins, ArrowUpCircle, ArrowDownCircle,
  CheckCircle, XCircle, Clock, Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface CreditPackage {
  id: string; name: string; credits: number; priceArs: number;
  pricePerCredit: number | null; isCustom: boolean;
}

interface Transaction {
  id: string; type: string; amount: number; description: string; createdAt: string;
}

const MIN_CUSTOM = 10;
const MAX_CUSTOM = 10_000;

function StatusBanner({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === "success")  return (
    <div className="flex items-center gap-2 rounded-xl border border-neon-green/30 bg-neon-green/5 p-4">
      <CheckCircle className="h-5 w-5 shrink-0 text-neon-green" />
      <p className="text-sm text-neon-green">Pago recibido. Tus créditos se acreditarán en unos segundos.</p>
    </div>
  );
  if (status === "failure")  return (
    <div className="flex items-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/5 p-4">
      <XCircle className="h-5 w-5 shrink-0 text-neon-red" />
      <p className="text-sm text-neon-red">El pago no pudo completarse. Podés intentarlo de nuevo.</p>
    </div>
  );
  if (status === "pending")  return (
    <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
      <Clock className="h-5 w-5 shrink-0 text-yellow-400" />
      <p className="text-sm text-yellow-400">Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite.</p>
    </div>
  );
  return null;
}

function CreditsPageInner() {
  const searchParams  = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [credits, setCredits]           = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages]         = useState<CreditPackage[]>([]);
  const [pkgsLoading, setPkgsLoading]   = useState(true);
  const [loadingPkg, setLoadingPkg]     = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customError, setCustomError]   = useState("");
  const [buyError, setBuyError]         = useState("");

  useEffect(() => {
    fetch("/api/credits").then((r) => r.json()).then((d) => {
      setCredits(d.credits ?? 0);
      setTransactions(d.transactions ?? []);
    });
    fetch("/api/credits/packages").then((r) => r.json()).then((d) => {
      setPackages(d.packages ?? []);
      setPkgsLoading(false);
    }).catch(() => setPkgsLoading(false));
  }, []);

  async function handleRecharge(credits: number, pkgId: string) {
    setBuyError("");
    setLoadingPkg(pkgId);
    try {
      const res  = await fetch("/api/credits/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBuyError(data.error ?? "Error al iniciar el pago");
      }
    } catch {
      setBuyError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoadingPkg(null);
    }
  }

  function handleCustomRecharge() {
    setCustomError("");
    const amount = parseInt(customAmount, 10);
    if (!amount || isNaN(amount))   { setCustomError("Ingresá una cantidad válida."); return; }
    if (amount < MIN_CUSTOM)        { setCustomError(`Mínimo ${MIN_CUSTOM} créditos.`); return; }
    if (amount > MAX_CUSTOM)        { setCustomError(`Máximo ${MAX_CUSTOM.toLocaleString("es-AR")} créditos.`); return; }
    handleRecharge(amount, "custom");
  }

  const regularPkgs = packages.filter((p) => !p.isCustom);
  const customPkg   = packages.find((p) => p.isCustom);
  const pricePerCredit = customPkg?.pricePerCredit ?? 100;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Créditos</h1>

      <StatusBanner status={paymentStatus} />

      {buyError && (
        <div className="flex items-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/5 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-neon-red" />
          <p className="text-sm text-neon-red">{buyError}</p>
        </div>
      )}

      {/* Saldo */}
      <Card className="text-center">
        <Coins className="h-12 w-12 text-neon-cyan mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Saldo actual</p>
        <p className="text-4xl font-bold text-neon-cyan mt-1">{credits}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">créditos disponibles</p>
      </Card>

      {/* Paquetes */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Recargar créditos</h2>

        {pkgsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="rounded-xl border border-brand-border bg-brand-surface h-36 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {regularPkgs.map((pkg) => {
              const isLoading = loadingPkg === pkg.id;
              return (
                <Card key={pkg.id} className="text-center">
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{pkg.credits}</p>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">créditos</p>
                  <p className="text-lg font-semibold text-neon-cyan mb-4">
                    ${pkg.priceArs.toLocaleString("es-AR")} ARS
                  </p>
                  <Button
                    onClick={() => handleRecharge(pkg.credits, pkg.id)}
                    disabled={loadingPkg !== null}
                    className="w-full"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                    ) : "Comprar"}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Monto personalizado */}
        <Card className="mt-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Monto personalizado</h3>
          <div className="flex gap-3">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setCustomError(""); }}
              placeholder={`Créditos (mín. ${MIN_CUSTOM})`}
              min={String(MIN_CUSTOM)}
              max={String(MAX_CUSTOM)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan/50"
            />
            <Button
              onClick={handleCustomRecharge}
              disabled={loadingPkg !== null || !customAmount}
            >
              {loadingPkg === "custom" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
              ) : `Comprar ($${pricePerCredit}/créd.)`}
            </Button>
          </div>
          {customError && <p className="mt-2 text-xs text-neon-red">{customError}</p>}
          {customAmount && !customError && parseInt(customAmount) >= MIN_CUSTOM && (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Total: <span className="text-neon-cyan font-medium">
                ${(parseInt(customAmount) * pricePerCredit).toLocaleString("es-AR")} ARS
              </span>
            </p>
          )}
        </Card>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Historial de movimientos</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                {["Tipo","Descripción","Créditos","Fecha"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)]">Sin movimientos aún</td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                  <td className="px-4 py-3">
                    {t.type === "credit" ? (
                      <div className="flex items-center gap-1.5 text-neon-green"><ArrowUpCircle className="h-4 w-4" /><span>Recarga</span></div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neon-red"><ArrowDownCircle className="h-4 w-4" /><span>Consumo</span></div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{t.description}</td>
                  <td className={`px-4 py-3 font-medium ${t.type === "credit" ? "text-neon-green" : "text-neon-red"}`}>
                    {t.type === "credit" ? "+" : "-"}{t.amount}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {new Date(t.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return <Suspense><CreditsPageInner /></Suspense>;
}
