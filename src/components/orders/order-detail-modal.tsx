"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  Truck, 
  Calendar,
  ExternalLink
} from "lucide-react";

interface OrderDetailModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const address = typeof order.address === "string" ? JSON.parse(order.address) : order.address;
  const products = typeof order.products === "string" ? JSON.parse(order.products) : order.products;
  const raw = order.rawPayload || {};

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="green">Pagado</Badge>;
      case "shipped": return <Badge variant="cyan">Enviado</Badge>;
      case "delivered": return <Badge variant="purple">Entregado</Badge>;
      case "cancelled": return <Badge variant="red">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle del Pedido #${order.externalId}`}>
      <div className="space-y-8">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Estado</p>
            <div>{statusBadge(order.status)}</div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Fecha</p>
            <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <Calendar className="h-4 w-4 text-neon-cyan" />
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </div>
          </div>
        </div>

        {/* Client & Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-neon-cyan">
              <User className="h-4 w-4" /> Cliente
            </h3>
            <div className="space-y-3 bg-brand-surface/30 p-4 rounded-xl border border-brand-border">
              <div className="flex items-start gap-3">
                <div className="text-[var(--text-primary)] font-medium text-sm">{order.buyerName}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <Mail className="h-3.5 w-3.5" /> {order.buyerEmail || "Sin email"}
              </div>
              {raw.customer?.phone && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <Phone className="h-3.5 w-3.5" /> {raw.customer.phone}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-neon-cyan">
              <MapPin className="h-4 w-4" /> Dirección de Envío
            </h3>
            <div className="space-y-2 bg-brand-surface/30 p-4 rounded-xl border border-brand-border">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {address.street} {address.number}
                {address.floor && `, ${address.floor}`}
                <br />
                {address.locality}, {address.city}
                <br />
                {address.province}, {address.zipcode}
                <br />
                {address.country}
              </p>
              {order.courier && (
                <div className="mt-2 flex items-center gap-2 text-xs text-neon-cyan font-medium">
                  <Truck className="h-3.5 w-3.5" /> {order.courier}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-neon-cyan">
            <Package className="h-4 w-4" /> Productos
          </h3>
          <div className="border border-brand-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface/50 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Producto</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {products.map((p: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--text-primary)]">{p.quantity}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">${p.price.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-brand-surface/20">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-bold text-[var(--text-secondary)]">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-neon-cyan text-lg">
                    ${order.totalAmount.toLocaleString("es-AR")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer info (External link to Tiendanube) */}
        <div className="pt-2">
          <a 
            href={`https://www.tiendanube.com/admin/orders/${order.externalId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] hover:text-neon-cyan transition-colors"
          >
            Ver en el administrador de Tiendanube <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Modal>
  );
}
