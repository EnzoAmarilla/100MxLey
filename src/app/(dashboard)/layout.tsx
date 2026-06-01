"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 1000); // 1-second transition/loading duration for pages
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-4 sm:p-6 relative min-h-[calc(100vh-64px)]">
          {routeLoading && (
            <div className="absolute inset-0 z-50 bg-brand-bg/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 transition-all duration-300">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border-4 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
                <Zap className="absolute h-5 w-5 text-neon-cyan animate-pulse drop-shadow-[0_0_8px_#00F5FF]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold tracking-wider text-neon-cyan uppercase animate-pulse">
                  Cargando sección
                </p>
              </div>
            </div>
          )}
          <div className={routeLoading ? "opacity-20 pointer-events-none transition-all duration-300" : "transition-all duration-300"}>
            {children}
          </div>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
}
