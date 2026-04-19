"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/providers";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Receipt,
  Package,
  Coins,
  PlayCircle,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Tiendanube",
    icon: ShoppingBag,
    children: [
      { label: "Pedidos", href: "/tiendanube" },
      { label: "Conectar tienda", href: "/tiendanube?tab=connect" },
    ],
  },
  {
    label: "Shopify",
    icon: Store,
    children: [
      { label: "Pedidos", href: "/shopify" },
      { label: "Conectar tienda", href: "/shopify?tab=connect" },
    ],
  },
  { label: "Facturación", href: "/billing", icon: Receipt },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Créditos", href: "/credits", icon: Coins },
  { label: "Ver tutorial", href: "#", icon: PlayCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[var(--border-color)]">
        <div className="h-8 w-8 rounded-lg bg-brand-accent flex items-center justify-center text-white font-bold text-sm">
          100
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]">
          100Mxley
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expanded === item.label;
            const isActive = item.children.some((c) =>
              pathname.startsWith(c.href.split("?")[0])
            );
            return (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : item.label)
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-accent/10 text-brand-accent"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === child.href.split("?")[0]
                            ? "text-brand-accent"
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

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-brand-accent/10 text-brand-accent"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border-color)] px-3 py-4 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span>Cambiar tema</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-red hover:bg-brand-red/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
