"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Iniciar sesión
      </h1>
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
          <p className="text-sm text-brand-red">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
      <div className="mt-4 text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-brand-accent hover:underline block"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-sm text-[var(--text-secondary)]">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-brand-accent hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </Card>
  );
}
