"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Coins, ArrowUpCircle, ArrowDownCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
const CREDIT_PRICES: Record<number, number> = {
  50: 5000,
  100: 9000,
  200: 16000,
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        setCredits(data.credits ?? 0);
        setTransactions(data.transactions ?? []);
      });
  }, []);

  async function handleRecharge(creditAmount: number, price: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/credits/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: creditAmount, amount: price }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al iniciar el pago");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCustomRecharge() {
    const amount = parseInt(customAmount);
    if (amount && amount > 0) {
      handleRecharge(amount, amount * 100);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Créditos</h1>

      {paymentStatus === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green/5 p-4">
          <CheckCircle className="h-5 w-5 text-brand-green" />
          <p className="text-sm text-brand-green">
            ¡Pago confirmado! Tus créditos se acreditarán en unos minutos.
          </p>
        </div>
      )}

      {/* Saldo actual */}
      <Card className="text-center">
        <Coins className="h-12 w-12 text-brand-accent mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Saldo actual</p>
        <p className="text-4xl font-bold text-brand-accent mt-1">{credits}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">créditos disponibles</p>
      </Card>

      {/* Paquetes de recarga */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Recargar créditos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(CREDIT_PRICES).map(([credits, price]) => (
            <Card key={credits} className="text-center">
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {credits}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">créditos</p>
              <p className="text-lg font-semibold text-brand-accent mb-4">
                ${price.toLocaleString("es-AR")} ARS
              </p>
              <Button
                onClick={() => handleRecharge(Number(credits), price)}
                disabled={loading}
                className="w-full"
              >
                Comprar
              </Button>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Monto personalizado
          </h3>
          <div className="flex gap-3">
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Cantidad de créditos"
              min="1"
              className="flex-1"
            />
            <Button onClick={handleCustomRecharge} disabled={loading || !customAmount}>
              Comprar ($100/créd.)
            </Button>
          </div>
        </Card>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Historial de movimientos
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">
                  Créditos
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--text-secondary)]"
                  >
                    Sin movimientos aún
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-4 py-3">
                      {t.type === "credit" ? (
                        <div className="flex items-center gap-1.5 text-brand-green">
                          <ArrowUpCircle className="h-4 w-4" />
                          <span>Recarga</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-brand-red">
                          <ArrowDownCircle className="h-4 w-4" />
                          <span>Consumo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {t.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.type === "credit"
                          ? "text-brand-green"
                          : "text-brand-red"
                      }`}
                    >
                      {t.type === "credit" ? "+" : "-"}
                      {t.amount}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {new Date(t.createdAt).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
