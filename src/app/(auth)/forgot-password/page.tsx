"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <Card>
        <div className="text-center space-y-4">
          <Mail className="h-12 w-12 text-brand-accent mx-auto" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Revisá tu email
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Si existe una cuenta con ese email, te enviamos las instrucciones
            para restablecer tu contraseña.
          </p>
          <Link href="/login" className="text-sm text-brand-accent hover:underline block">
            Volver al login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Recuperar contraseña
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          <Mail className="h-4 w-4" />
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-brand-accent hover:underline">
          Volver al login
        </Link>
      </div>
    </Card>
  );
}
