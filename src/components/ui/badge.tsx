import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "cyan" | "green" | "yellow" | "red" | "purple";
  className?: string;
}

const variants = {
  default: "bg-brand-surface text-[var(--text-secondary)] border border-brand-border",
  cyan:    "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30",
  green:   "bg-neon-green/10 text-neon-green border border-neon-green/30",
  yellow:  "bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30",
  red:     "bg-neon-red/10 text-neon-red border border-neon-red/30",
  purple:  "bg-neon-purple/10 text-neon-purple border border-neon-purple/30",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
