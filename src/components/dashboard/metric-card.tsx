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
    <div className="relative rounded-xl border border-brand-border bg-brand-card p-5 overflow-hidden transition-all duration-300 hover:border-neon-cyan/30 hover:shadow-[0_0_24px_rgba(0,245,255,0.06)] group">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />

      {locked && (
        <div className="absolute inset-0 bg-brand-card/85 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
          <Lock className="h-5 w-5 text-neon-cyan/40 mb-2" />
          <span className="text-xs text-[var(--text-secondary)] tracking-widest uppercase">En construcción</span>
        </div>
      )}

      <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] mb-2">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">{value}</p>

      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? "text-neon-green" : "text-neon-red"}`}>
          {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{change >= 0 ? "+" : ""}{change}%</span>
        </div>
      )}
    </div>
  );
}
