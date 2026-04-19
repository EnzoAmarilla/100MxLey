"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, CheckSquare, Square } from "lucide-react";

interface Order {
  id: string;
  externalId: string;
  buyerName: string;
  products: any[];
  courier: string | null;
  status: string;
  exported: boolean;
  createdAt: string;
}

interface OrdersTableProps {
  orders: Order[];
  onExport: (orderIds: string[]) => void;
  exporting: boolean;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge variant="success">Pagado</Badge>;
    case "shipped":
      return <Badge variant="default">Enviado</Badge>;
    case "cancelled":
      return <Badge variant="danger">Cancelado</Badge>;
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

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <th className="px-4 py-3 text-left w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                # Pedido
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                Comprador
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                Productos
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                Courier
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-[var(--text-secondary)]"
                >
                  No hay pedidos para mostrar
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(order.id)}>
                      {selected.has(order.id) ? (
                        <CheckSquare className="h-4 w-4 text-brand-accent" />
                      ) : (
                        <Square className="h-4 w-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                    #{order.externalId}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {order.buyerName}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {(order.products as any[]).map((p, i) => (
                      <span key={i} className="block">
                        {p.sku} × {p.quantity}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {order.courier || "—"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
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
