"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Coins, Save } from "lucide-react";

export default function AccountPage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mi cuenta</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Información personal
            </h2>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={session?.user?.name || ""}
                disabled
              />
              <Input
                label="Email"
                type="email"
                value={session?.user?.email || ""}
                disabled
              />
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-brand-accent" />
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {session?.user?.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {session?.user?.email}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-brand-accent">
                <Coins className="h-4 w-4" />
                <span className="font-semibold">{credits} créditos</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
