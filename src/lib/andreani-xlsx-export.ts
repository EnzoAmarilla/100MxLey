// Generates the Andreani .xlsx import file from the real Andreani template
// (src/lib/templates/andreani-template.xlsx). Server-only: relies on `fs`,
// so this must never be imported from a "use client" components — only from
// API routes. Keep CSV/types/normalization in @/lib/logistics-export, which
// client pages do import.

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
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
// Row 0 (0-based) = group header, Row 1 = column header, Row 2+ = data
const FIRST_DATA_ROW = 2;

function loadTemplate(): XLSX.WorkBook {
  const buf = fs.readFileSync(TEMPLATE_PATH);
  // cellStyles:true preserves colours, borders and merged cells from the template
  return XLSX.read(buf, { type: "buffer", cellStyles: true });
}

// Remove any pre-existing sample rows from the target sheet (rows from
// FIRST_DATA_ROW downwards). The two header rows are never touched.
function clearSampleRows(wb: XLSX.WorkBook, sheetName: string) {
  const ws  = wb.Sheets[sheetName];
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  for (let r = FIRST_DATA_ROW; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      delete ws[XLSX.utils.encode_cell({ r, c })];
    }
  }
}

function fillSheet(
  wb: XLSX.WorkBook,
  sheetName: string,
  rows: (string | number)[][],
  textColumns: number[],
) {
  const ws = wb.Sheets[sheetName];
  rows.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      const addr = XLSX.utils.encode_cell({ r: FIRST_DATA_ROW + rIdx, c: cIdx });
      if (textColumns.includes(cIdx)) {
        ws[addr] = { t: "s", v: String(val ?? ""), z: "@" };
      } else if (typeof val === "number") {
        ws[addr] = { t: "n", v: val };
      } else {
        ws[addr] = { t: "s", v: String(val ?? "") };
      }
    });
  });

  // Extend !ref so the written data rows are included when XLSX serialises
  // the workbook (the new template ships with no sample rows, so !ref would
  // otherwise stop at the two header rows).
  if (rows.length > 0) {
    const existing    = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    const lastDataRow = FIRST_DATA_ROW + rows.length - 1;
    const lastDataCol = Math.max(...rows.map((r) => r.length - 1), existing.e.c);
    ws["!ref"] = XLSX.utils.encode_range({
      s: existing.s,
      e: { r: Math.max(existing.e.r, lastDataRow), c: lastDataCol },
    });
  }
}

function generateAndreaniXLSX(
  orders: NormalizedOrder[],
  shippingType: AndreaniType,
  filenamePrefix: string,
): ExportFile {
  const wb = loadTemplate();

  // Wipe sample rows from all order sheets; leave "Configuracion" intact.
  clearSampleRows(wb, "A domicilio");
  clearSampleRows(wb, "A sucursal");
  clearSampleRows(wb, "Llega hoy");

  if (shippingType === "domicilio") {
    fillSheet(wb, "A domicilio", orders.map(andreaniDomicilioRow), ANDREANI_DOMICILIO_TEXT_COLUMNS);
  } else {
    fillSheet(wb, "A sucursal", orders.map(andreaniSucursalRow), ANDREANI_SUCURSAL_TEXT_COLUMNS);
  }

  // cellStyles:true ensures all header colours, borders and merged cells are
  // carried through to the output file.
  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx", cellStyles: true }) as string;
  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `${filenamePrefix}_${dateTag}.xlsx`,
    content:  base64,
    encoding: "base64",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export function generateAndreaniHomeXLSX(orders: NormalizedOrder[]): ExportFile {
  return generateAndreaniXLSX(orders, "domicilio", "andreani_estandar_domicilio");
}

export function generateAndreaniBranchXLSX(orders: NormalizedOrder[]): ExportFile {
  return generateAndreaniXLSX(orders, "sucursal", "andreani_estandar_sucursal");
}
