"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderFiltersProps {
  status: string;
  dateFrom: string;
  dateTo: string;
  courier: string;
  onStatusChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onCourierChange: (v: string) => void;
}

const fmt = (d: Date) => d.toISOString().split("T")[0];

const PRESETS = [
  { label: "Hoy",       id: "today" },
  { label: "7 días",    id: "7d" },
  { label: "2 semanas", id: "14d" },
  { label: "1 mes",     id: "30d" },
  { label: "Todos",     id: "all" },
] as const;

function presetDates(id: string): [string, string] {
  const today = new Date();
  if (id === "today") return [fmt(today), fmt(today)];
  if (id === "7d") {
    const f = new Date(today); f.setDate(f.getDate() - 7);
    return [fmt(f), fmt(today)];
  }
  if (id === "14d") {
    const f = new Date(today); f.setDate(f.getDate() - 14);
    return [fmt(f), fmt(today)];
  }
  if (id === "30d") {
    const f = new Date(today); f.setDate(f.getDate() - 30);
    return [fmt(f), fmt(today)];
  }
  return ["", ""];
}

export function OrderFilters({
  status,
  dateFrom,
  dateTo,
  courier,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onCourierChange,
}: OrderFiltersProps) {
  const [activePreset, setActivePreset] = useState<string>("all");

  function applyPreset(id: string) {
    setActivePreset(id);
    const [from, to] = presetDates(id);
    onDateFromChange(from);
    onDateToChange(to);
  }

  function handleManualFrom(v: string) {
    setActivePreset("");
    onDateFromChange(v);
  }

  function handleManualTo(v: string) {
    setActivePreset("");
    onDateToChange(v);
  }

  // Sync preset if dates cleared externally
  useEffect(() => {
    if (!dateFrom && !dateTo && activePreset !== "all") setActivePreset("all");
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-3 mb-4">
      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)] font-medium mr-1">Período:</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={[
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activePreset === p.id
                ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
                : "bg-brand-surface/50 text-[var(--text-secondary)] border border-brand-border hover:border-neon-cyan/30 hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}

        {/* Manual date inputs */}
        <div className="flex items-center gap-2 ml-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleManualFrom(e.target.value)}
            className="w-36 h-7 text-xs"
          />
          <span className="text-[var(--text-secondary)] text-xs">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleManualTo(e.target.value)}
            className="w-36 h-7 text-xs"
          />
        </div>
      </div>

      {/* Status + courier row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-brand-accent focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Por cobrar</option>
          <option value="paid">Por empaquetar</option>
          <option value="ready_to_ship">Por enviar</option>
          <option value="shipped">En camino</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <Input
          value={courier}
          onChange={(e) => onCourierChange(e.target.value)}
          placeholder="Courier..."
          className="w-40"
        />
      </div>
    </div>
  );
}
