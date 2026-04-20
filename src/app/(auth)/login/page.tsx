"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error || !result?.ok) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="relative rounded-xl border border-brand-border bg-brand-card p-8 shadow-card">
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent rounded-t-xl" />

      <h1 className="text-lg font-bold text-[var(--text-primary)] mb-1">Acceder al sistema</h1>
      <p className="text-xs text-[var(--text-secondary)] mb-6 tracking-wide">Ingresá tus credenciales para continuar</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-neon-red/25 bg-neon-red/5 px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 text-neon-red shrink-0" />
            <p className="text-xs text-neon-red">{error}</p>
          </div>
        )}
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Verificando..." : "Ingresar"}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-brand-border text-center space-y-2">
        <Link href="/forgot-password" className="text-xs text-[var(--text-secondary)] hover:text-neon-cyan transition-colors block">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-xs text-[var(--text-secondary)]">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-neon-cyan hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
