"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Package,
  Coins,
  PlayCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldCheck,
  Truck,
  PackagePlus,
  ListChecks,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavProgress } from "@/components/layout/nav-progress";
import { TrendingUp } from "lucide-react";

function DolarBlue() {
  const [venta, setVenta] = useState<number | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("https://dolarapi.com/v1/dolares/blue")
        .then((r) => r.json())
        .then((d) => setVenta(d.venta ?? null))
        .catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (venta === null) return null;

  return (
    <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-brand-surface border border-brand-border flex items-center gap-2">
      <TrendingUp className="h-3.5 w-3.5 text-neon-green shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider leading-none mb-0.5">Dólar Blue</p>
        <p className="text-sm font-bold text-neon-green leading-none">${venta.toLocaleString("es-AR")} ARS</p>
      </div>
      <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse shrink-0" />
    </div>
  );
}

const navItems = [
  { label: "Inicio",              href: "/dashboard",    icon: LayoutDashboard, logisticsGated: false },
  { label: "Integraciones",       href: "/integrations", icon: Zap,             logisticsGated: false },
  {
    label: "Tiendanube",
    icon: ShoppingBag,
    logisticsGated: false,
    children: [
      { label: "Pedidos", href: "/tiendanube" },
    ],
  },
  {
    label: "Shopify",
    icon: Store,
    logisticsGated: false,
    children: [
      { label: "Pedidos", href: "/shopify" },
    ],
  },
  { label: "Stock",               href: "/stock",        icon: Package,    logisticsGated: false },
  { label: "Créditos",            href: "/credits",      icon: Coins,      logisticsGated: false },
  { label: "Pedidos / Logística", href: "/logistics",    icon: Truck,      logisticsGated: true },
  { label: "Pedido de colecta",   href: "/colecta",      icon: PackagePlus, logisticsGated: true },
  { label: "Mis colectas",        href: "/mis-colectas", icon: ListChecks, logisticsGated: true },
  { label: "Ver tutorial",        href: "/tutorials",    icon: PlayCircle, logisticsGated: false },
];

export function Sidebar() {
  const pathname    = usePathname();
  const { start }   = useNavProgress();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logisticsEnabled, setLogisticsEnabled] = useState<boolean | null>(null);
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";

  useEffect(() => {
    if (session?.user?.role !== "CLIENT") return;
    fetch("/api/client/access")
      .then((r) => r.json())
      .then((d) => setLogisticsEnabled(d.logisticsEnabled ?? false))
      .catch(() => setLogisticsEnabled(false));
  }, [session?.user?.role]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col border-r border-brand-border bg-brand-bg">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-neon-cyan/[0.03] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-neon-purple/[0.03] blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-5 py-5 border-b border-brand-border">
        <div className="relative h-9 w-9 rounded-lg flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/30">
          <Zap className="h-5 w-5 text-neon-cyan" />
          <div className="absolute inset-0 rounded-lg bg-neon-cyan/5 blur-sm" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            100<span className="text-neon-cyan">Mx</span>ley
          </span>
          <p className="text-[10px] text-[var(--text-secondary)] tracking-widest uppercase">Sistema</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {isSuperAdmin && (
          <Link
            href="/superadmin"
            onClick={start}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold mb-2 bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 hover:border-neon-purple/50 transition-all duration-200 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 drop-shadow-[0_0_6px_#8b5cf6]" />
            <span>Panel Superadmin</span>
          </Link>
        )}
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expanded === item.label;
            const isActive = item.children.some((c) =>
              pathname.startsWith(c.href.split("?")[0])
            );
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                      : "text-[var(--text-secondary)] hover:bg-brand-surface hover:text-[var(--text-primary)] border border-transparent"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "drop-shadow-[0_0_6px_#00F5FF]" : ""}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 mb-0.5 pl-3 border-l border-neon-cyan/15 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={start}
                        className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                          pathname === child.href.split("?")[0]
                            ? "text-neon-cyan"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isLocked = item.logisticsGated && logisticsEnabled === false;
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={start}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[inset_0_0_20px_rgba(0,245,255,0.05)]"
                  : "text-[var(--text-secondary)] hover:bg-brand-surface hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${pathname === item.href ? "drop-shadow-[0_0_6px_#00F5FF]" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock className="h-3 w-3 opacity-40 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="relative border-t border-brand-border pt-3">
        <DolarBlue />
        <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-neon-red/10 hover:text-neon-red border border-transparent hover:border-neon-red/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
        </div>
      </div>
    </aside>
  );
}
