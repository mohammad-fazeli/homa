import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { CUSTOMER_IMPORT_TEMPLATE_HEADERS } from "../../shared/import-customers";
import { readSpreadsheetTable, writeCustomerImportTemplate } from "./spreadsheet";

const temps: string[] = [];

afterEach(() => {
  for (const file of temps.splice(0)) {
    try {
      fs.unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
});

describe("spreadsheet import template", () => {
  it("round-trips the Excel template", () => {
    const file = path.join(os.tmpdir(), `homa-import-${Date.now()}.xlsx`);
    temps.push(file);
    writeCustomerImportTemplate(file);
    const table = readSpreadsheetTable(file);
    expect(table[0]).toEqual([...CUSTOMER_IMPORT_TEMPLATE_HEADERS]);
    expect(table[1]?.[0]).toBe("علی");
    expect(table[1]?.[2]).toBe("09121234567");
  });

  it("reads a UTF-8 CSV with a BOM", () => {
    const file = path.join(os.tmpdir(), `homa-import-${Date.now()}.csv`);
    temps.push(file);
    writeCustomerImportTemplate(file);
    const table = readSpreadsheetTable(file);
    expect(table[0]?.[0]).toBe("نام");
    expect(table[1]?.[1]).toBe("رضایی");
  });
});
