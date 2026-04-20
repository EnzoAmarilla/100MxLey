import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variants = {
  primary:
    "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/20 hover:border-neon-cyan/70 hover:shadow-neon-cyan active:scale-[0.98]",
  secondary:
    "bg-brand-surface text-[var(--text-primary)] border border-brand-border hover:border-neon-cyan/30 hover:text-neon-cyan",
  danger:
    "bg-neon-red/10 text-neon-red border border-neon-red/40 hover:bg-neon-red/20 hover:border-neon-red/70 hover:shadow-neon-red active:scale-[0.98]",
  ghost:
    "text-[var(--text-secondary)] hover:bg-brand-surface hover:text-neon-cyan",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
