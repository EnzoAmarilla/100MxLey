"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, CheckSquare, Square } from "lucide-react";

interface Product {
  sku: string;
  quantity: number;
}

interface Order {
  id: string;
  externalId: string;
  buyerName: string;
  products: any; // Changed from any[] to any to handle raw strings/nulls
  courier: string | null;
  status: string;
  exported: boolean;
  createdAt: string;
}

function parseProducts(products: unknown): Product[] {
  if (typeof products === "string") {
    try {
      const parsed = JSON.parse(products);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(products) ? products : [];
}

interface OrdersTableProps {
  orders: Order[];
  onExport: (orderIds: string[]) => void;
  exporting: boolean;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge variant="green">Pagado</Badge>;
    case "shipped":
      return <Badge variant="cyan">Enviado</Badge>;
    case "delivered":
      return <Badge variant="purple">Entregado</Badge>;
    case "cancelled":
      return <Badge variant="red">Cancelado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export function OrdersTable({ orders, onExport, exporting }: OrdersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={toggleAll} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {selected.size === orders.length && orders.length > 0 ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          onClick={() => onExport(Array.from(selected))}
          disabled={selected.size === 0 || exporting}
          size="sm"
        >
          <FileDown className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar rótulos"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              <th className="px-4 py-3 text-left w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                # Pedido
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                Comprador
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                Productos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                Courier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-secondary)] text-sm">
                  No hay pedidos para mostrar
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-brand-border hover:bg-brand-surface transition-colors"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(order.id)}>
                      {selected.has(order.id) ? (
                        <CheckSquare className="h-4 w-4 text-neon-cyan" />
                      ) : (
                        <Square className="h-4 w-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-neon-cyan/80 text-xs">
                    #{order.externalId}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {order.buyerName}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {parseProducts(order.products).map((p, i) => (
                      <span key={i} className="block text-xs">
                        {p.sku} × {p.quantity}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] text-xs">
                    {order.courier || "—"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs font-mono">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
