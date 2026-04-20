"use client";

import Link from "next/link";

interface StatusCardProps {
  label: string;
  value: string | number;
  linkText: string;
  linkHref: string;
  color?: string;
}

export function StatusCard({ label, value, linkText, linkHref, color = "text-neon-cyan" }: StatusCardProps) {
  return (
    <div className="relative rounded-xl border border-brand-border bg-brand-card p-5 transition-all duration-300 hover:border-neon-cyan/30 hover:shadow-[0_0_24px_rgba(0,245,255,0.06)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent rounded-t-xl" />
      <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] mb-2">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
      <Link
        href={linkHref}
        className="text-xs text-neon-cyan/70 hover:text-neon-cyan hover:underline mt-3 inline-flex items-center gap-1 transition-colors"
      >
        {linkText} →
      </Link>
    </div>
  );
}
