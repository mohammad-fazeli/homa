import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  CUSTOMER_IMPORT_SAMPLE_ROW,
  CUSTOMER_IMPORT_TEMPLATE_HEADERS,
} from "../../shared/import-customers";

const xlsx = (XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX;

export function readSpreadsheetTable(filePath: string): string[][] {
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath)) {
    throw new Error("فایل پیدا نشد");
  }

  const workbook =
    ext === ".csv" || ext === ".txt"
      ? readCsvWorkbook(filePath)
      : xlsx.readFile(filePath, { raw: false, cellDates: false });

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) return [];

  const rows = xlsx.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  return rows.map((row) =>
    (row ?? []).map((cell) => String(cell ?? "").trim())
  );
}

export function writeCustomerImportTemplate(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") {
    const body = [CUSTOMER_IMPORT_TEMPLATE_HEADERS, CUSTOMER_IMPORT_SAMPLE_ROW]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    fs.writeFileSync(filePath, `\uFEFF${body}\r\n`, "utf8");
    return;
  }

  const sheet = xlsx.utils.aoa_to_sheet([
    [...CUSTOMER_IMPORT_TEMPLATE_HEADERS],
    [...CUSTOMER_IMPORT_SAMPLE_ROW],
  ]);
  sheet["!cols"] = CUSTOMER_IMPORT_TEMPLATE_HEADERS.map((header) => ({
    wch: Math.max(12, header.length + 4),
  }));
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "مشتریان");
  xlsx.writeFile(workbook, filePath);
}

function readCsvWorkbook(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const text = decodeCsv(buffer);
  const FS = detectCsvSeparator(text);
  return xlsx.read(text, { type: "string", FS, raw: false });
}

function detectCsvSeparator(text: string): string {
  const line = (text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "").trim();
  const commas = (line.match(/,/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function decodeCsv(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.toString("utf8");
  }
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  return buffer.toString("latin1");
}

function csvCell(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
