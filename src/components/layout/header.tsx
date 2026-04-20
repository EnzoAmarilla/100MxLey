"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Coins, Zap } from "lucide-react";
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
    <header className="sticky top-0 z-30 h-14 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
        <span className="text-xs text-[var(--text-secondary)] tracking-widest uppercase">Online</span>
      </div>

      <div className="flex items-center gap-3">
        {credits !== null && (
          <Link
            href="/credits"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-medium border border-neon-cyan/25 hover:bg-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-neon-cyan transition-all duration-200"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="font-mono font-bold">{credits}</span>
            <span className="text-neon-cyan/70">créditos</span>
          </Link>
        )}
        <Link
          href="/account"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-brand-surface hover:text-[var(--text-primary)] border border-transparent hover:border-brand-border transition-all text-xs"
        >
          <div className="h-5 w-5 rounded-full bg-neon-cyan/10 border border-neon-cyan/25 flex items-center justify-center">
            <User className="h-3 w-3 text-neon-cyan" />
          </div>
          <span>{session?.user?.name || "Mi cuenta"}</span>
        </Link>
      </div>
    </header>
  );
}
