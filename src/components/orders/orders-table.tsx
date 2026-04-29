"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, CheckSquare, Square, Eye, Package } from "lucide-react";
import { OrderDetailModal } from "./order-detail-modal";

interface Product {
  sku: string;
  quantity: number;
}

interface Order {
  id: string;
  externalId: string;
  buyerName: string;
  buyerEmail: string;
  address: any;
  products: any;
  courier: string | null;
  status: string;
  exported: boolean;
  totalAmount: number;
  shippingCost: number;
  createdAt: string;
  paymentLabel: string | null;
  shippingOptionName: string | null;
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

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

function fmtDate(d: string | Date): string {
  return dateFmt.format(new Date(d)).replace(".", "");
}

interface OrdersTableProps {
  orders: Order[];
  onExport: (orderIds: string[]) => void;
  exporting: boolean;
}

function paymentBadge(status: string) {
  if (["paid", "ready_to_ship", "shipped", "delivered"].includes(status))
    return <Badge variant="green">Recibido</Badge>;
  if (status === "cancelled")
    return <Badge variant="red">Anulado</Badge>;
  return <Badge variant="yellow">Pendiente</Badge>;
}

function shippingBadge(status: string) {
  switch (status) {
    case "ready_to_ship": return <Badge variant="cyan">Por enviar</Badge>;
    case "shipped":       return <Badge variant="purple">En camino</Badge>;
    case "delivered":     return <Badge variant="green">Entregado</Badge>;
    case "cancelled":     return <Badge variant="red">Cancelado</Badge>;
    case "paid":          return <Badge variant="yellow">Por empaquetar</Badge>;
    default:              return <Badge variant="default">Sin envío</Badge>;
  }
}

export function OrdersTable({ orders, onExport, exporting }: OrdersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

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

  const thClass = "px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)]";

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
          <span className="text-sm text-[var(--text-secondary)] font-medium">
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

      <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-card/50 backdrop-blur-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface/80">
              <th className="px-4 py-3 text-left w-10"></th>
              <th className={thClass}># Pedido</th>
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Comprador</th>
              <th className={thClass}>Total</th>
              <th className={thClass}>Productos</th>
              <th className={thClass}>Pago</th>
              <th className={thClass}>Envío</th>
              <th className={thClass}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 opacity-20" />
                    <span>No hay pedidos para mostrar</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const units = parseProducts(order.products).reduce(
                  (s, p) => s + (p.quantity || 1), 0
                );
                return (
                  <tr
                    key={order.id}
                    className="border-b border-brand-border hover:bg-brand-surface/40 transition-all duration-200"
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(order.id)}>
                        {selected.has(order.id) ? (
                          <CheckSquare className="h-4 w-4 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]" />
                        ) : (
                          <Square className="h-4 w-4 text-[var(--text-secondary)]" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono text-neon-cyan/90 text-xs whitespace-nowrap">
                      #{order.externalId}
                    </td>

                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{order.buyerName}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{order.buyerEmail}</div>
                    </td>

                    <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                      ${order.totalAmount?.toLocaleString("es-AR")}
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {units} unid.
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {paymentBadge(order.status)}
                        {order.paymentLabel && (
                          <span className="text-[10px] text-[var(--text-secondary)] leading-tight">
                            {order.paymentLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {shippingBadge(order.status)}
                        {order.shippingOptionName && (
                          <span className="text-[10px] text-[var(--text-secondary)] leading-tight max-w-[140px] truncate">
                            {order.shippingOptionName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />
    </div>
  );
}
