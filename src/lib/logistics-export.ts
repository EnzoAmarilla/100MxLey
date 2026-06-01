// Utilities for logistics CSV export — Andreani & Correo Argentino

export type LogisticsProvider = "andreani" | "correo_argentino";
export type AndreaniType      = "domicilio" | "sucursal";

export interface NormalizedOrder {
  orderId:       string;
  orderNumber:   string;
  source:        string;
  customerName:  string;
  phone:         string;
  email:         string;
  dni:           string;
  street:        string;
  streetNumber:  string;
  floor:         string;
  apartment:     string;
  city:          string;
  province:      string;
  postalCode:    string;
  weightKg:      number;
  heightCm:      number;
  widthCm:       number;
  lengthCm:      number;
  declaredValue: number;
  shippingMethod: string;
  branchCode:    string;
  branchName:    string;
  reference:     string;
}

export interface ValidationError {
  orderId:     string;
  orderNumber: string;
  errors:      string[];
}

export interface ExportFile {
  filename: string;
  content:  string;
}

function safeParseJSON(val: unknown): any {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val ?? null;
}

export function normalizeOrderForLogistics(order: any): NormalizedOrder {
  const address = safeParseJSON(order.address)    ?? {};
  const raw     = safeParseJSON(order.rawPayload) ?? order.rawPayload ?? {};
  const source  = order.store?.platform ?? "tiendanube";

  const phone = String(raw?.customer?.phone ?? "").trim();

  // Sum weight from rawPayload products (grams → kg)
  let totalWeightGrams = 0;
  for (const rp of (raw?.products ?? [])) {
    const w = parseFloat(rp.weight ?? 0);
    const q = parseInt(rp.quantity ?? 1);
    if (!isNaN(w) && !isNaN(q)) totalWeightGrams += w * q;
  }
  const weightKg = totalWeightGrams > 0 ? +(totalWeightGrams / 1000).toFixed(3) : 0;

  return {
    orderId:       order.id,
    orderNumber:   order.externalId,
    source,
    customerName:  (order.buyerName  || "").trim(),
    phone,
    email:         (order.buyerEmail || "").trim(),
    dni:           "",
    street:        (address.street   || "").trim(),
    streetNumber:  (address.number   || "").trim(),
    floor:         (address.floor    || "").trim(),
    apartment:     (address.floor    || "").trim(),
    city:          (address.locality || address.city || "").trim(),
    province:      (address.province || "").trim(),
    postalCode:    (address.zipcode  || address.zip  || "").trim(),
    weightKg,
    heightCm:      0,
    widthCm:       0,
    lengthCm:      0,
    declaredValue: order.totalAmount ?? 0,
    shippingMethod: (typeof raw?.shipping_option === "string" ? raw.shipping_option : raw?.shipping_option?.name) ?? "",
    branchCode:    "",
    branchName:    "",
    reference:     order.externalId,
  };
}

export function validateOrderForExport(
  order: NormalizedOrder,
  provider: LogisticsProvider,
  andreaniType?: AndreaniType
): string[] {
  const errors: string[] = [];

  if (!order.customerName) errors.push("falta nombre del comprador");
  if (!order.declaredValue || order.declaredValue <= 0) errors.push("valor declarado inválido");

  if (provider === "andreani") {
    if (andreaniType === "domicilio") {
      if (!order.street)       errors.push("falta calle");
      if (!order.streetNumber) errors.push("falta número de calle");
      if (!order.city)         errors.push("falta localidad");
      if (!order.province)     errors.push("falta provincia");
      if (!order.postalCode)   errors.push("falta código postal");
    } else {
      if (!order.branchCode && !order.branchName)
        errors.push("falta sucursal Andreani (código o nombre)");
    }
  }

  if (provider === "correo_argentino") {
    if (!order.street)       errors.push("falta calle");
    if (!order.streetNumber) errors.push("falta número de calle");
    if (!order.city)         errors.push("falta localidad");
    if (!order.province)     errors.push("falta provincia");
    if (!order.postalCode)   errors.push("falta código postal");
  }

  return errors;
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(fields: unknown[]): string {
  return fields.map(escapeCSV).join(";");
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  return [csvRow(headers), ...rows.map(csvRow)].join("\r\n");
}

// ── Andreani — Domicilio ─────────────────────────────────────────────────────

const ANDREANI_HOME_HEADERS = [
  "nombre_apellido", "telefono", "email", "dni", "observaciones",
  "calle", "numero", "piso", "departamento",
  "codigo_postal", "localidad", "provincia",
  "peso_kg", "alto_cm", "ancho_cm", "largo_cm",
  "valor_declarado", "numero_pedido", "referencia_venta",
];

export function generateAndreaniHomeCSV(orders: NormalizedOrder[]): ExportFile {
  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `andreani_domicilio_${dateTag}.csv`,
    content: buildCSV(
      ANDREANI_HOME_HEADERS,
      orders.map((o) => [
        o.customerName, o.phone, o.email, o.dni, "",
        o.street, o.streetNumber, o.floor, o.apartment,
        o.postalCode, o.city, o.province,
        o.weightKg, o.heightCm, o.widthCm, o.lengthCm,
        o.declaredValue.toFixed(2), o.orderNumber, o.reference,
      ])
    ),
  };
}

// ── Andreani — Sucursal ──────────────────────────────────────────────────────

const ANDREANI_BRANCH_HEADERS = [
  "nombre_apellido", "telefono", "email", "dni",
  "codigo_sucursal", "nombre_sucursal",
  "peso_kg", "alto_cm", "ancho_cm", "largo_cm",
  "valor_declarado", "numero_pedido", "referencia_venta",
];

export function generateAndreaniBranchCSV(orders: NormalizedOrder[]): ExportFile {
  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `andreani_sucursal_${dateTag}.csv`,
    content: buildCSV(
      ANDREANI_BRANCH_HEADERS,
      orders.map((o) => [
        o.customerName, o.phone, o.email, o.dni,
        o.branchCode, o.branchName,
        o.weightKg, o.heightCm, o.widthCm, o.lengthCm,
        o.declaredValue.toFixed(2), o.orderNumber, o.reference,
      ])
    ),
  };
}

// ── Correo Argentino (máx 40 por archivo) ────────────────────────────────────

const CORREO_HEADERS = [
  "nombre_apellido", "telefono", "email", "dni_cuit",
  "calle", "numero", "piso", "departamento",
  "localidad", "provincia", "codigo_postal",
  "peso_kg", "alto_cm", "ancho_cm", "largo_cm",
  "valor_declarado", "tipo_envio",
  "id_pedido", "referencia",
];

export const CORREO_MAX_PER_FILE = 40;

export function generateCorreoArgentinoCSV(orders: NormalizedOrder[]): ExportFile[] {
  const dateTag = new Date().toISOString().slice(0, 10);
  const files: ExportFile[] = [];
  const chunks = Math.ceil(orders.length / CORREO_MAX_PER_FILE);

  for (let i = 0; i < orders.length; i += CORREO_MAX_PER_FILE) {
    const chunk     = orders.slice(i, i + CORREO_MAX_PER_FILE);
    const fileIndex = Math.floor(i / CORREO_MAX_PER_FILE) + 1;
    const filename  = chunks === 1
      ? `correo_argentino_${dateTag}.csv`
      : `correo_argentino_${fileIndex}_${dateTag}.csv`;

    files.push({
      filename,
      content: buildCSV(
        CORREO_HEADERS,
        chunk.map((o) => [
          o.customerName, o.phone, o.email, o.dni,
          o.street, o.streetNumber, o.floor, o.apartment,
          o.city, o.province, o.postalCode,
          o.weightKg, o.heightCm, o.widthCm, o.lengthCm,
          o.declaredValue.toFixed(2),
          o.shippingMethod || "standard",
          o.orderNumber, o.reference,
        ])
      ),
    });
  }

  return files;
}
