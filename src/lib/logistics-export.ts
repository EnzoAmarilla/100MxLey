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
    dni:           parseDNI(String(raw?.customer?.identification ?? raw?.billing_address?.identification ?? "")),
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
    branchCode:    raw?.shipping_pickup_details?.branch_code || raw?.shipping_option?.code || "",
    branchName:    raw?.shipping_pickup_details?.branch_name || (typeof raw?.shipping_option === "string" ? raw.shipping_option : raw?.shipping_option?.name) || "",
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
    }
    // Para sucursal ya no requerimos que se haya ingresado manualmente el código/nombre
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

function parseDNI(identification: string): string {
  const cleaned = identification.replace(/[^\w]/g, "");
  if (/^\d{11}$/.test(cleaned)) {
    // Si es un CUIT/CUIL de 11 dígitos, el DNI está en el medio (índices 2 al 10)
    return cleaned.slice(2, 10).replace(/^0+/, "");
  }
  return cleaned;
}

function splitName(fullName: string): { firstName: string, lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: fullName.trim(), lastName: "" };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function splitPhone(phone: string): { area: string, num: string } {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("549")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("54")) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  
  // Al ser difícil adivinar el código de área correcto (puede ser 2, 3 o 4 dígitos),
  // enviamos todo el número en el campo "num" para que no se corte de manera extraña,
  // y dejamos el código de área vacío salvo que sepamos que es "11".
  if (cleaned.startsWith("11") && cleaned.length === 10) {
    return { area: "11", num: cleaned.slice(2) };
  }
  
  return { area: "", num: cleaned };
}

// ── Andreani ─────────────────────────────────────────────────────────────────

export function generateAndreaniHomeCSV(orders: NormalizedOrder[]): ExportFile {
  const template = "Características;;;;;;;Destinatario;;;;;;Domicilio destino;;;;;\r\n\"Paquete Guardado \nEj: Parlante Speaker\";\"Peso (grs)\nEj: \";\"Alto (cm)\nEj: \";\"Ancho (cm)\nEj: \";\"Profundidad (cm)\nEj: \";\"Valor declarado ($ C/IVA) *\nEj: \";\"Numero Interno\nEj: \";\"Nombre *\nEj: \";\"Apellido *\nEj: \";\"DNI *\nEj: \";\"Email *\nEj: \";\"Celular código *\nEj: \";\"Celular número *\nEj: \";\"Calle *\nEj: \";\"Número *\nEj: \";\"Piso\nEj: \";\"Departamento\nEj: \";\"Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657\";\"Observaciones\nEj: \"";

  const rows = orders.map((o) => {
    const { area, num } = splitPhone(o.phone || "");
    const { firstName, lastName } = splitName(o.customerName || "");
    return [
      "Paquete", // Paquete Guardado
      Math.round(o.weightKg * 1000) || 1000, // Peso (grs)
      o.heightCm || 10, // Alto (cm)
      o.widthCm || 10,  // Ancho (cm)
      o.lengthCm || 10, // Profundidad (cm)
      o.declaredValue.toFixed(2), // Valor declarado
      o.orderNumber || "", // Numero Interno
      firstName, // Nombre
      lastName, // Apellido
      o.dni || "", // DNI
      o.email || "", // Email
      area, // Celular codigo
      num, // Celular numero
      o.street || "", // Calle
      o.streetNumber || "", // Número
      o.floor || "", // Piso
      o.apartment || "", // Departamento
      `${o.province || ""} / ${o.city || ""} / ${o.postalCode || ""}`, // Provincia / Localidad / CP
      "" // Observaciones
    ];
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `andreani_domicilio_${dateTag}.csv`,
    content: template + "\r\n" + rows.map(csvRow).join("\r\n"),
  };
}

export function generateAndreaniBranchCSV(orders: NormalizedOrder[]): ExportFile {
  const template = "Características;;;;;;;Destinatario;;;;;;Domicilio destino;;;;;\r\n\"Paquete Guardado \nEj: Parlante Speaker\";\"Peso (grs)\nEj: \";\"Alto (cm)\nEj: \";\"Ancho (cm)\nEj: \";\"Profundidad (cm)\nEj: \";\"Valor declarado ($ C/IVA) *\nEj: \";\"Numero Interno\nEj: \";\"Nombre *\nEj: \";\"Apellido *\nEj: \";\"DNI *\nEj: \";\"Email *\nEj: \";\"Celular código *\nEj: \";\"Celular número *\nEj: \";\"Calle *\nEj: \";\"Número *\nEj: \";\"Piso\nEj: \";\"Departamento\nEj: \";\"Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657\";\"Observaciones\nEj: \"";

  const rows = orders.map((o) => {
    const { area, num } = splitPhone(o.phone || "");
    const { firstName, lastName } = splitName(o.customerName || "");
    return [
      "Paquete", // Paquete Guardado
      Math.round(o.weightKg * 1000) || 1000, // Peso (grs)
      o.heightCm || 10, // Alto (cm)
      o.widthCm || 10,  // Ancho (cm)
      o.lengthCm || 10, // Profundidad (cm)
      o.declaredValue.toFixed(2), // Valor declarado
      o.orderNumber || "", // Numero Interno
      firstName, // Nombre
      lastName, // Apellido
      o.dni || "", // DNI
      o.email || "", // Email
      area, // Celular codigo
      num, // Celular numero
      o.street || "", // Calle
      o.streetNumber || "", // Número
      o.floor || "", // Piso
      o.apartment || "", // Departamento
      `${o.province || ""} / ${o.city || ""} / ${o.postalCode || ""}`, // Provincia / Localidad / CP
      "" // Observaciones
    ];
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `andreani_sucursal_${dateTag}.csv`,
    content: template + "\r\n" + rows.map(csvRow).join("\r\n"),
  };
}

// ── Correo Argentino (máx 40 por archivo) ────────────────────────────────────

export const CORREO_MAX_PER_FILE = 40;

export function generateCorreoArgentinoCSV(orders: NormalizedOrder[]): ExportFile[] {
  const template = "tipo_producto(obligatorio);largo(obligatorio en CM);ancho(obligatorio en CM);altura(obligatorio en CM);peso(obligatorio en KG);valor_del_contenido(obligatorio en pesos argentinos);provincia_destino(obligatorio);sucursal_destino(obligatorio solo en caso de no ingresar localidad de destino);localidad_destino(obligatorio solo en caso de no ingresar sucursal de destino);calle_destino(obligatorio solo en caso de no ingresar sucursal de destino);altura_destino(obligatorio solo en caso de no ingresar sucursal de destino);piso(opcional solo en caso de no ingresar sucursal de destino);dpto(opcional solo en caso de no ingresar sucursal de destino);codpostal_destino(obligatorio solo en caso de no ingresar sucursal de destino);destino_nombre(obligatorio);destino_email(obligatorio, debe ser un email valido);cod_area_tel(opcional);tel(opcional);cod_area_cel(obligatorio);cel(obligatorio);numero_orden(opcional)";

  const dateTag = new Date().toISOString().slice(0, 10);
  const files: ExportFile[] = [];
  const chunks = Math.ceil(orders.length / CORREO_MAX_PER_FILE);

  for (let i = 0; i < orders.length; i += CORREO_MAX_PER_FILE) {
    const chunk     = orders.slice(i, i + CORREO_MAX_PER_FILE);
    const fileIndex = Math.floor(i / CORREO_MAX_PER_FILE) + 1;
    const filename  = chunks === 1
      ? `correo_argentino_${dateTag}.csv`
      : `correo_argentino_${fileIndex}_${dateTag}.csv`;

    const rows = chunk.map((o) => {
      const { area, num } = splitPhone(o.phone || "");
      return [
        "Paquete", // tipo_producto
        o.lengthCm || 10, // largo
        o.widthCm || 10, // ancho
        o.heightCm || 10, // altura
        o.weightKg || 1, // peso
        o.declaredValue.toFixed(2), // valor_del_contenido
        o.province || "", // provincia_destino
        o.branchCode || "", // sucursal_destino
        o.city || "", // localidad_destino
        o.street || "", // calle_destino
        o.streetNumber || "", // altura_destino
        o.floor || "", // piso
        o.apartment || "", // dpto
        o.postalCode || "", // codpostal_destino
        o.customerName || "", // destino_nombre
        o.email || "", // destino_email
        "", // cod_area_tel
        "", // tel
        area, // cod_area_cel
        num, // cel
        o.orderNumber || "", // numero_orden
      ];
    });

    files.push({
      filename,
      // We do not append \r\n to rows that Correo might complain about, but standard CSV allows it.
      content: template + "\r\n" + rows.map(csvRow).join("\r\n"),
    });
  }

  return files;
}
