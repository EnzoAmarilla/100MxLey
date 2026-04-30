"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Coins,
  CreditCard,
  Receipt,
  Truck,
  UserCog,
  Settings,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",         href: "/superadmin",             icon: LayoutDashboard },
  { label: "Clientes",          href: "/superadmin/clients",     icon: Users },
  { label: "Créditos / Precios",href: "/superadmin/credits",     icon: Coins },
  { label: "Compras / Pagos",   href: "/superadmin/payments",    icon: CreditCard },
  { label: "Facturación",       href: "/superadmin/billing",     icon: Receipt },
  { label: "Envíos",            href: "/superadmin/shipments",   icon: Truck },
  { label: "Usuarios internos", href: "/superadmin/admin-users", icon: UserCog },
  { label: "Configuración",     href: "/superadmin/settings",    icon: Settings },
  { label: "Auditoría",         href: "/superadmin/audit-log",   icon: ClipboardList },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col border-r border-brand-border bg-brand-bg">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-neon-purple/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-neon-cyan/[0.03] blur-3xl" />
      </div>

      {/* Logo + badge */}
      <div className="relative flex items-center gap-3 px-5 py-5 border-b border-brand-border">
        <div className="relative h-9 w-9 rounded-lg flex items-center justify-center bg-neon-purple/10 border border-neon-purple/30">
          <ShieldCheck className="h-5 w-5 text-neon-purple" />
          <div className="absolute inset-0 rounded-lg bg-neon-purple/5 blur-sm" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            100<span className="text-neon-purple">Mx</span>ley
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="h-2.5 w-2.5 text-neon-purple" />
            <p className="text-[9px] text-neon-purple tracking-widest uppercase font-semibold">Superadmin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/superadmin"
              ? pathname === "/superadmin"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]"
                  : "text-[var(--text-secondary)] hover:bg-brand-surface hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${isActive ? "drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" : ""}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="relative border-t border-brand-border px-3 py-4 space-y-2">
        {session?.user && (
          <div className="px-3 py-2 rounded-lg bg-brand-surface border border-brand-border">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{session.user.name}</p>
            <p className="text-[10px] text-neon-purple truncate">{session.user.email}</p>
          </div>
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-brand-surface border border-transparent hover:border-brand-border transition-all"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Panel cliente</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-neon-red/10 hover:text-neon-red border border-transparent hover:border-neon-red/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
