// Generates the Andreani .xlsx import file from the real Andreani template
// (src/lib/templates/andreani-template.xlsx). Server-only: relies on `fs`,
// so this must never be imported from a "use client" component — only from
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
const FIRST_DATA_ROW = 2; // 0-based: row 1 = group header, row 2 = column header, row 3 = first data row

function loadTemplate(): XLSX.WorkBook {
  const buf = fs.readFileSync(TEMPLATE_PATH);
  return XLSX.read(buf, { type: "buffer" });
}

// The template ships with sample rows already filled in (used to verify it
// imports correctly in Andreani). Those must never leak into a real export.
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

function fillSheet(wb: XLSX.WorkBook, sheetName: string, rows: (string | number)[][], textColumns: number[]) {
  const ws = wb.Sheets[sheetName];
  rows.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      const ref = XLSX.utils.encode_cell({ r: FIRST_DATA_ROW + rIdx, c: cIdx });
      if (textColumns.includes(cIdx)) {
        ws[ref] = { t: "s", v: String(val ?? "") };
      } else if (typeof val === "number") {
        ws[ref] = { t: "n", v: val };
      } else {
        ws[ref] = { t: "s", v: String(val ?? "") };
      }
    });
  });
}

function generateAndreaniXLSX(orders: NormalizedOrder[], shippingType: AndreaniType, filenamePrefix: string): ExportFile {
  const wb = loadTemplate();

  // The template ships with sample data in these 3 order sheets — wipe it
  // before writing real rows. "Configuracion" (reference data) is left intact.
  clearSampleRows(wb, "A domicilio");
  clearSampleRows(wb, "A sucursal");
  clearSampleRows(wb, "Llega hoy");

  if (shippingType === "domicilio") {
    fillSheet(wb, "A domicilio", orders.map(andreaniDomicilioRow), ANDREANI_DOMICILIO_TEXT_COLUMNS);
  } else {
    fillSheet(wb, "A sucursal", orders.map(andreaniSucursalRow), ANDREANI_SUCURSAL_TEXT_COLUMNS);
  }

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
  const dateTag = new Date().toISOString().slice(0, 10);
  return {
    filename: `${filenamePrefix}_${dateTag}.xlsx`,
    content: base64,
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
