import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-brand-surface px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none transition-all duration-200
            ${error
              ? "border-neon-red/60 focus:border-neon-red focus:shadow-neon-red"
              : "border-brand-border focus:border-neon-cyan/60 focus:shadow-[0_0_0_1px_rgba(0,245,255,0.15),0_0_12px_rgba(0,245,255,0.08)]"
            } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-neon-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
