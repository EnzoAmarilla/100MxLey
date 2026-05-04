"use client";

import { useRouter } from "next/navigation";
import { Users, ChevronRight, X } from "lucide-react";
import { useAdminClient } from "@/contexts/admin-client";

export function ClientSelectorBar() {
  const { activeClient, setActiveClient, hydrated } = useAdminClient();
  const router = useRouter();

  if (!hydrated) {
    return (
      <div className="sticky top-0 z-10 border-b border-amber-900/20 bg-[#0c0a07]/95 backdrop-blur px-8 py-2.5 h-11" />
    );
  }

  if (!activeClient) {
    return (
      <div className="sticky top-0 z-10 border-b border-amber-900/30 bg-amber-500/[0.04] backdrop-blur px-8 py-2.5 flex items-center gap-3">
        <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-600">Sin cliente seleccionado — los datos están ocultos.</p>
        <button
          onClick={() => router.push("/admin/clients")}
          className="ml-auto flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Seleccionar cliente <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 border-b border-amber-500/20 bg-amber-500/[0.06] backdrop-blur px-8 py-2.5 flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-amber-500/25 border border-amber-500/40 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-amber-400">{activeClient.name.charAt(0).toUpperCase()}</span>
      </div>
      <span className="text-xs text-amber-500/70">Gestionando</span>
      <span className="text-sm font-semibold text-amber-300">{activeClient.name}</span>
      {activeClient.storeName && (
        <span className="text-xs text-amber-600 hidden sm:inline">— {activeClient.storeName}</span>
      )}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/clients")}
          className="text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
        >
          Cambiar
        </button>
        <button
          onClick={() => setActiveClient(null)}
          className="p-0.5 rounded hover:bg-amber-500/10 text-amber-600 hover:text-amber-400 transition-colors"
          title="Deseleccionar cliente"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
