// Generates the Andreani .xlsx file by surgically injecting data rows into the
// original template ZIP — every other file in the archive is kept byte-for-byte
// identical to the template, so colours, borders, merged cells, column widths
// and every other style property are preserved without needing style support
// from any library.
//
// Server-only: uses `fs`. Never import from "use client" components.

import fs from "fs";
import path from "path";
import JSZip from "jszip";
import {
  andreaniDomicilioRow,
  andreaniSucursalRow,
  ANDREANI_DOMICILIO_TEXT_COLUMNS,
  ANDREANI_SUCURSAL_TEXT_COLUMNS,
  type AndreaniType,
  type ExportFile,
  type NormalizedOrder,
} from "@/lib/logistics-export";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/templates/andreani-template.xlsx");

// ── Excel helpers ─────────────────────────────────────────────────────────────

function colLetter(idx: number): string {
  let s = "";
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Build a single <x:row> XML string (1-based rowNum, 0-based column values).
// Text columns are forced to inline strings; everything else follows the type.
function buildRowXml(
  rowNum: number,
  values: (string | number)[],
  textColumns: number[],
): string {
  const cols = values.length;
  const cells = values.map((val, cIdx) => {
    const addr = `${colLetter(cIdx)}${rowNum}`;
    if (textColumns.includes(cIdx) || typeof val === "string") {
      // inline string — no need to touch sharedStrings.xml
      const text = escapeXml(String(val ?? ""));
      return `<x:c r="${addr}" t="inlineStr"><x:is><x:t>${text}</x:t></x:is></x:c>`;
    }
    // numeric
    return `<x:c r="${addr}"><x:v>${val}</x:v></x:c>`;
  });
  return `<x:row r="${rowNum}" spans="1:${cols}">${cells.join("")}</x:row>`;
}

// ── Sheet name → file path resolver (reads workbook.xml + workbook.xml.rels) ──

async function resolveSheetPath(zip: JSZip, sheetName: string): Promise<string> {
  const wbXml  = await zip.file("xl/workbook.xml")!.async("text");
  const relXml = await zip.file("xl/_rels/workbook.xml.rels")!.async("text");

  // Extract rId for the requested sheet name (handle both r:id and rId attribute order)
  const sheetRe = new RegExp(`name="${sheetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*(r:id|rId)="([^"]+)"`);
  const sheetM  = wbXml.match(sheetRe);
  if (!sheetM) throw new Error(`Sheet "${sheetName}" not found in workbook.xml`);
  const rId = sheetM[2];

  // Find the <Relationship> element that contains this Id, then extract Target
  // The attributes can appear in any order, so we first isolate the element.
  const elemRe = new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*/?>`, "i");
  const elemM  = relXml.match(elemRe);
  if (!elemM) throw new Error(`Relationship "${rId}" not found in workbook.xml.rels`);
  const targetM = elemM[0].match(/Target="([^"]+)"/);
  if (!targetM) throw new Error(`No Target in relationship "${rId}"`);

  // Target paths may be absolute (/xl/worksheets/sheet1.xml) or relative
  return targetM[1].replace(/^\//, "");
}

// ── Configuracion sheet location lookup ──────────────────────────────────────
// Reads the hidden "Configuracion" sheet in the Andreani template (which
// contains all valid "PROVINCIA / LOCALIDAD / CP" dropdown values) and builds
// a lookup from postal-code → list of matching strings. At row-build time we
// pick the candidate whose province prefix matches the order data, giving an
// exact match against Andreani's dropdown without any external API.

async function buildLocationLookup(zip: JSZip): Promise<Map<string, string[]>> {
  const lookup = new Map<string, string[]>();
  try {
    // 1. Parse shared strings — the template stores all strings there
    const sharedStrings: string[] = [];
    const ssFile = zip.file("xl/sharedStrings.xml");
    if (ssFile) {
      const ssXml = await ssFile.async("text");
      const siRe  = /<(?:x:)?si\b[^>]*>([\s\S]*?)<\/(?:x:)?si>/g;
      let si;
      while ((si = siRe.exec(ssXml)) !== null) {
        const texts: string[] = [];
        const tRe  = /<(?:x:)?t[^>]*>([^<]*)<\/(?:x:)?t>/g;
        let t;
        while ((t = tRe.exec(si[1])) !== null) texts.push(t[1]);
        sharedStrings.push(texts.join(""));
      }
    }

    // 2. Read Configuracion sheet cells (shared-string type t="s")
    const configPath = await resolveSheetPath(zip, "Configuracion");
    const configXml  = await zip.file(configPath)!.async("text");
    const cellRe = /<(?:x:)?c\b[^>]*\bt="s"[^>]*>\s*<(?:x:)?v>(\d+)<\/(?:x:)?v>/g;
    let cm;
    while ((cm = cellRe.exec(configXml)) !== null) {
      const val = sharedStrings[parseInt(cm[1])];
      if (!val) continue;
      // Match strings like "BUENOS AIRES / ROSARIO / 2000"
      const cpMatch = val.match(/^.+\s*\/\s*.+\s*\/\s*(\d+)\s*$/);
      if (cpMatch) {
        const postalCode = cpMatch[1].trim();
        const list = lookup.get(postalCode) ?? [];
        list.push(val.trim());
        lookup.set(postalCode, list);
      }
    }
  } catch {
    // If the sheet can't be parsed, return empty map and fall back to formatted string
  }
  return lookup;
}

// Pick the best candidate from the lookup for a given order postal code + province.
function resolveLocation(
  lookup: Map<string, string[]>,
  postalCode: string,
  province: string,
): string | undefined {
  const candidates = lookup.get(postalCode);
  if (!candidates?.length) return undefined;
  const prov = province.toUpperCase().trim();
  return candidates.find(c => c.startsWith(prov)) ?? candidates[0];
}

// ── Core injection ────────────────────────────────────────────────────────────

// Injects data rows into a sheet's XML string and updates <x:dimension>.
// Data always starts at Excel row 3 (rows 1–2 are the two header rows).
function injectRows(sheetXml: string, rowXmls: string[]): string {
  if (rowXmls.length === 0) return sheetXml;

  // Update <x:dimension ref="A1:Sn" />
  const lastRow  = 2 + rowXmls.length; // 2 header rows + data rows
  const dimRe    = /(<x:dimension ref=")([^"]+)(")/;
  const dimMatch = sheetXml.match(dimRe);
  if (dimMatch) {
    const oldRef   = dimMatch[2];               // e.g. "A1:S2"
    const colEnd   = oldRef.replace(/.*:([A-Z]+)\d+$/, "$1"); // "S"
    const newRef   = `A1:${colEnd}${lastRow}`;
    sheetXml = sheetXml.replace(dimRe, `$1${newRef}$3`);
  }

  // Inject rows before </x:sheetData>
  const newRows = rowXmls.join("");
  sheetXml = sheetXml.replace("</x:sheetData>", `${newRows}</x:sheetData>`);

  return sheetXml;
}

// ── Public API ────────────────────────────────────────────────────────────────

async function generateAndreaniXLSX(
  orders: NormalizedOrder[],
  shippingType: AndreaniType,
  filenamePrefix: string,
): Promise<ExportFile> {
  const templateBuf = fs.readFileSync(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuf);

  const targetSheet = shippingType === "domicilio" ? "A domicilio" : "A sucursal";
  const rowFn       = shippingType === "domicilio" ? andreaniDomicilioRow : andreaniSucursalRow;
  const textCols    = shippingType === "domicilio"
    ? ANDREANI_DOMICILIO_TEXT_COLUMNS
    : ANDREANI_SUCURSAL_TEXT_COLUMNS;

  const sheetPath      = await resolveSheetPath(zip, targetSheet);
  let sheetXml         = await zip.file(sheetPath)!.async("text");

  // For domicilio: build CP→string lookup from the Configuracion sheet so that
  // Provincia/Localidad/CP matches Andreani's dropdown exactly.
  const locationLookup = shippingType === "domicilio"
    ? await buildLocationLookup(zip)
    : new Map<string, string[]>();

  // Build one <x:row> per order (Excel row 3 onwards)
  const rowXmls = orders.map((order, idx) => {
    const vals = rowFn(order);
    if (shippingType === "domicilio" && order.postalCode) {
      const matched = resolveLocation(locationLookup, order.postalCode, order.province);
      if (matched) vals[17] = matched; // index 17 = Provincia / Localidad / CP
    }
    return buildRowXml(3 + idx, vals, textCols);
  });

  sheetXml = injectRows(sheetXml, rowXmls);

  // Write the modified sheet back into the zip — everything else untouched
  zip.file(sheetPath, sheetXml);

  const outBuf = await zip.generateAsync({
    type:               "nodebuffer",
    compression:        "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const base64  = outBuf.toString("base64");
  const dateTag = new Date().toISOString().slice(0, 10);

  return {
    filename: `${filenamePrefix}_${dateTag}.xlsx`,
    content:  base64,
    encoding: "base64",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export function generateAndreaniHomeXLSX(orders: NormalizedOrder[]): Promise<ExportFile> {
  return generateAndreaniXLSX(orders, "domicilio", "andreani_estandar_domicilio");
}

export function generateAndreaniBranchXLSX(orders: NormalizedOrder[]): Promise<ExportFile> {
  return generateAndreaniXLSX(orders, "sucursal", "andreani_estandar_sucursal");
}
