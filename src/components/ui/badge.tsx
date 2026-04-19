import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

const variants = {
  default: "bg-brand-accent/10 text-brand-accent",
  success: "bg-brand-green/10 text-brand-green",
  warning: "bg-brand-yellow/10 text-brand-yellow",
  danger: "bg-brand-red/10 text-brand-red",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
