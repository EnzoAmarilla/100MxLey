"use client";

import Link from "next/link";

interface StatusCardProps {
  label: string;
  value: string | number;
  linkText: string;
  linkHref: string;
  color?: string;
}

export function StatusCard({
  label,
  value,
  linkText,
  linkHref,
  color = "text-brand-accent",
}: StatusCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <p className="text-sm text-[var(--text-secondary)] mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <Link
        href={linkHref}
        className="text-sm text-brand-accent hover:underline mt-3 inline-block"
      >
        {linkText} →
      </Link>
    </div>
  );
}
