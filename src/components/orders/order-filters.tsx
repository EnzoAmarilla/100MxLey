"use client";

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
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-brand-accent focus:outline-none"
      >
        <option value="">Todos los estados</option>
        <option value="paid">Pagado</option>
        <option value="shipped">Enviado</option>
        <option value="cancelled">Cancelado</option>
      </select>

      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        placeholder="Desde"
        className="w-auto"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        placeholder="Hasta"
        className="w-auto"
      />

      <Input
        value={courier}
        onChange={(e) => onCourierChange(e.target.value)}
        placeholder="Courier..."
        className="w-auto"
      />
    </div>
  );
}
