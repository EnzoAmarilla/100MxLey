"use client";

import { Card } from "@/components/ui/card";
import { Package, Construction } from "lucide-react";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stock</h1>
      <Card className="text-center py-12">
        <Construction className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Próximamente
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          El módulo de stock está en desarrollo. Pronto podrás gestionar tu
          inventario desde acá.
        </p>
      </Card>
    </div>
  );
}
