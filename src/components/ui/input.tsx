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
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent transition-colors ${
            error ? "border-brand-red" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-brand-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
