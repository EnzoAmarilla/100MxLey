"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Coins } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/credits")
        .then((r) => r.json())
        .then((d) => setCredits(d.credits))
        .catch(() => {});
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {credits !== null && (
          <Link
            href="/credits"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-accent/10 text-brand-accent text-sm font-medium hover:bg-brand-accent/20 transition-colors"
          >
            <Coins className="h-4 w-4" />
            <span>{credits} créditos</span>
          </Link>
        )}
        <Link
          href="/account"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm"
        >
          <User className="h-4 w-4" />
          <span>{session?.user?.name || "Mi cuenta"}</span>
        </Link>
      </div>
    </header>
  );
}
