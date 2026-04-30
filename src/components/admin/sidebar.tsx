"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Truck,
  Users,
  ClipboardList,
  History,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import type { Session } from "next-auth";

const navItems = [
  { label: "Dashboard operativo", href: "/admin",                   icon: LayoutDashboard },
  { label: "Pedidos / Logística", href: "/admin/orders",            icon: Truck },
  { label: "Inventario clientes", href: "/admin/client-inventory",  icon: Boxes },
  { label: "Clientes",            href: "/admin/clients",           icon: Users },
  { label: "Incidencias",         href: "/admin/incidents",         icon: ClipboardList },
  { label: "Historial operativo", href: "/admin/history",           icon: History },
];

interface Props {
  session: Session;
}

export function AdminSidebar({ session }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col border-r border-amber-900/30 bg-[#0c0a07]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-amber-500/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-orange-500/[0.03] blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-5 py-5 border-b border-amber-900/30">
        <div className="relative h-9 w-9 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <div className="absolute inset-0 rounded-lg bg-amber-500/5 blur-sm" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">
            100<span className="text-amber-400">Mx</span>ley
          </span>
          <p className="text-[10px] text-amber-600 tracking-widest uppercase">Staff Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "drop-shadow-[0_0_6px_#F59E0B]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + actions */}
      <div className="relative border-t border-amber-900/30 px-3 pt-3 pb-4 space-y-2">
        <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs font-medium text-zinc-200 truncate">{session.user.name}</p>
          <p className="text-[11px] text-zinc-500 truncate">{session.user.email}</p>
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold tracking-wide">
            STAFF
          </span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
