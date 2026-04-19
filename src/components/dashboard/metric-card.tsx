"use client";

import { Lock, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  locked?: boolean;
}

export function MetricCard({ label, value, change, locked }: MetricCardProps) {
  return (
    <div className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 overflow-hidden">
      {locked && (
        <div className="absolute inset-0 bg-[var(--bg-card)]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Lock className="h-6 w-6 text-[var(--text-secondary)] mb-2" />
          <span className="text-xs text-[var(--text-secondary)]">En construcción</span>
        </div>
      )}
      <p className="text-sm text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            change >= 0 ? "text-brand-green" : "text-brand-red"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{change >= 0 ? "+" : ""}{change}%</span>
        </div>
      )}
    </div>
  );
}
