"use client";

import Link from "next/link";
import { Users } from "lucide-react";

export function NoClientSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <Users className="h-8 w-8 text-amber-400 opacity-80" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">No hay cliente seleccionado</h2>
      <p className="text-sm text-zinc-500 max-w-xs mb-6">
        Seleccioná un cliente para ver sus pedidos, inventario y logística sin mezclar datos.
      </p>
      <Link
        href="/admin/clients"
        className="px-5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-all"
      >
        Ir a clientes
      </Link>
    </div>
  );
}
