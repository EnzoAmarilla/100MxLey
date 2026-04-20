import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "green" | "none";
}

const glowMap = {
  cyan:   "hover:shadow-[0_0_0_1px_rgba(0,245,255,0.25),0_8px_32px_rgba(0,245,255,0.08)] hover:border-neon-cyan/30",
  purple: "hover:shadow-[0_0_0_1px_rgba(189,0,255,0.25),0_8px_32px_rgba(189,0,255,0.08)] hover:border-neon-purple/30",
  green:  "hover:shadow-[0_0_0_1px_rgba(0,255,136,0.25),0_8px_32px_rgba(0,255,136,0.08)] hover:border-neon-green/30",
  none:   "",
};

export function Card({ children, className = "", glow = "cyan" }: CardProps) {
  return (
    <div
      className={`relative rounded-xl border border-brand-border bg-brand-card p-6 transition-all duration-300 shadow-card ${glowMap[glow]} ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent rounded-t-xl" />
      {children}
    </div>
  );
}
