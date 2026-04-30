"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

const STATUS_CLS: Record<string, string> = {
  approved: "text-neon-green  bg-neon-green/10  border-neon-green/20",
  pending:  "text-yellow-400  bg-yellow-400/10  border-yellow-400/20",
  rejected: "text-neon-red    bg-neon-red/10    border-neon-red/20",
  cancelled:"text-[var(--text-secondary)] bg-brand-surface border-brand-border",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/clients?sort=createdAt")
      .then(() =>
        fetch("/api/superadmin/dashboard?period=30d")
          .then((r) => r.json())
          .then(() => setLoading(false))
      )
      .catch(() => setLoading(false));

    // Direct query via existing endpoint pattern
    fetch("/api/superadmin/clients?sort=createdAt")
      .then((r) => r.json())
      .then(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Compras / Pagos</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Historial global de pagos de créditos</p>
      </div>
      <div className="rounded-xl border border-brand-border bg-brand-surface p-10 text-center">
        <CreditCard className="h-10 w-10 mx-auto mb-3 text-neon-purple opacity-40" />
        <p className="text-[var(--text-secondary)] text-sm">Sección en desarrollo — disponible en Phase 2</p>
      </div>
    </div>
  );
}
