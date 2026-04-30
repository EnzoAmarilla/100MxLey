import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const OPERATIONAL_STATUSES = [
  "pendiente",
  "en_preparacion",
  "listo_para_despachar",
  "enviado",
  "en_camino",
  "entregado",
  "cancelado",
  "incidencia",
] as const;

export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

export const STATUS_LABELS: Record<OperationalStatus, string> = {
  pendiente:              "Pendiente",
  en_preparacion:         "En preparación",
  listo_para_despachar:   "Listo para despachar",
  enviado:                "Enviado",
  en_camino:              "En camino",
  entregado:              "Entregado",
  cancelado:              "Cancelado",
  incidencia:             "Incidencia",
};

export const STATUS_CLIENT_MESSAGES: Record<OperationalStatus, string> = {
  pendiente:              "Recibimos tu pedido y está pendiente de revisión.",
  en_preparacion:         "Tu pedido está siendo preparado.",
  listo_para_despachar:   "Tu pedido está listo para ser despachado.",
  enviado:                "Tu pedido fue enviado.",
  en_camino:              "Tu pedido está en camino.",
  entregado:              "Tu pedido fue entregado.",
  cancelado:              "Tu pedido fue cancelado.",
  incidencia:             "Hay una incidencia con tu pedido. Nuestro equipo lo está revisando.",
};

export const STATUS_COLORS: Record<OperationalStatus, string> = {
  pendiente:              "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  en_preparacion:         "bg-amber-500/20 text-amber-300 border-amber-500/30",
  listo_para_despachar:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  enviado:                "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  en_camino:              "bg-violet-500/20 text-violet-300 border-violet-500/30",
  entregado:              "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelado:              "bg-red-500/20 text-red-300 border-red-500/30",
  incidencia:             "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") return null;
  return session.user;
}
