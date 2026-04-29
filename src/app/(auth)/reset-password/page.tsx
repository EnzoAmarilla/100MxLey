"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, XCircle } from "lucide-react";

function ResetPasswordForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!token) setError("El enlace es inválido. Solicitá uno nuevo.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al restablecer la contraseña.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card>
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-neon-green mx-auto drop-shadow-[0_0_12px_#00FF88]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Contraseña actualizada</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tu contraseña fue restablecida correctamente. Redirigiendo al login...
          </p>
          <Link href="/login" className="text-sm text-neon-cyan hover:underline block">
            Ir al login ahora
          </Link>
        </div>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-neon-red mx-auto" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Enlace inválido</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Este enlace no es válido o ya fue usado. Solicitá uno nuevo.
          </p>
          <Link href="/forgot-password" className="text-sm text-neon-cyan hover:underline block">
            Solicitar nuevo enlace
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-5 w-5 text-neon-cyan" />
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Nueva contraseña</h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Elegí una contraseña segura de al menos 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repetí la contraseña"
          required
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-neon-red/10 border border-neon-red/30 px-3 py-2.5">
            <XCircle className="h-4 w-4 text-neon-red shrink-0" />
            <p className="text-xs text-neon-red">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          <Lock className="h-4 w-4" />
          {loading ? "Guardando..." : "Restablecer contraseña"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-neon-cyan transition-colors">
          Volver al login
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
