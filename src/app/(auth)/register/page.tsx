"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al registrarse");
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Crear cuenta
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
        />
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
          placeholder="Mínimo 6 caracteres"
          minLength={6}
          required
        />
        {error && (
          <p className="text-sm text-brand-red">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-brand-accent hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </Card>
  );
}
