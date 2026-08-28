import { describe, expect, it } from "vitest";
import { isValidNationalId } from "./validation";
import {
  CUSTOMER_IMPORT_TEMPLATE_HEADERS,
  coerceImportNationalId,
  coerceImportPhone,
  isPlaceholderCard,
  mapImportHeaders,
  previewCustomerImport,
  readyImportDrafts,
  splitFullName,
} from "./import-customers";

const NID = "0123456789";
const NID2 = "0499370899";

describe("import helpers", () => {
  it("accepts the sample national ids", () => {
    expect(isValidNationalId(NID)).toBe(true);
    expect(isValidNationalId(coerceImportNationalId("123456789"))).toBe(
      isValidNationalId(NID)
    );
  });

  it("folds Persian and English headers", () => {
    const mapped = mapImportHeaders([
      "نام",
      "نام خانوادگی",
      "تلفن",
      "کد ملی",
      "کارت",
      "باقی‌مانده",
      "پرداخت شده",
    ]);
    expect(mapped.firstName).toBe(0);
    expect(mapped.lastName).toBe(1);
    expect(mapped.phone).toBe(2);
    expect(mapped.nationalId).toBe(3);
    expect(mapped.uidCart).toBe(4);
    expect(mapped.remaining).toBe(5);
    expect(mapped.paidAmount).toBe(6);
  });

  it("maps the downloadable template headers", () => {
    const mapped = mapImportHeaders([...CUSTOMER_IMPORT_TEMPLATE_HEADERS]);
    expect(mapped.firstName).toBe(0);
    expect(mapped.paidAmount).toBe(10);
  });

  it("coerces Iranian phones dropped by Excel", () => {
    expect(coerceImportPhone("9123456789")).toBe("09123456789");
    expect(coerceImportPhone("+98 912 345 6789")).toBe("09123456789");
    expect(coerceImportPhone("989123456789")).toBe("09123456789");
    expect(coerceImportPhone("۰۹۱۲-۳۴۵-۶۷۸۹")).toBe("09123456789");
  });

  it("pads national ids that lost a leading zero", () => {
    expect(coerceImportNationalId("123456789")).toBe("0123456789");
  });

  it("splits a full name and ignores card placeholders", () => {
    expect(splitFullName("سارا محمدی")).toEqual({
      firstName: "سارا",
      lastName: "محمدی",
    });
    expect(isPlaceholderCard("ندارد")).toBe(true);
    expect(isPlaceholderCard("A1B2")).toBe(false);
  });
});

describe("previewCustomerImport", () => {
  const header = [...CUSTOMER_IMPORT_TEMPLATE_HEADERS];

  it("prepares a valid row with remaining credit and unpaid balance", () => {
    const preview = previewCustomerImport([
      header,
      [
        "سارا",
        "محمدی",
        "09121234567",
        NID,
        "",
        "از لیست قدیمی",
        "ویولن",
        "۲٬۴۰۰٬۰۰۰",
        "12",
        "8",
        "1200000",
      ],
    ]);
    expect(preview.readyCount).toBe(1);
    const draft = readyImportDrafts(preview)[0];
    expect(draft.phone).toBe("09121234567");
    expect(draft.course).toEqual({
      title: "ویولن",
      cost: 2400000,
      sessions: 8,
      notes: "قرارداد قبلی 12 جلسه",
    });
    expect(draft.paidAmount).toBe(1200000);
    expect(draft.notes).toBe("از لیست قدیمی");
  });

  it("uses sessions as credit when remaining is empty", () => {
    const preview = previewCustomerImport([
      header,
      ["علی", "رضایی", "09120000000", NID, "", "", "پیانو", "800000", "12", "", ""],
    ]);
    expect(readyImportDrafts(preview)[0].course?.sessions).toBe(12);
    expect(readyImportDrafts(preview)[0].paidAmount).toBe(0);
  });

  it("skips invalid phones and national ids", () => {
    const preview = previewCustomerImport([
      header,
      ["علی", "رضایی", "02112345678", NID, "", "", "", "", "", "", ""],
      ["سارا", "محمدی", "09121234567", "1111111111", "", "", "", "", "", "", ""],
    ]);
    expect(preview.errorCount).toBe(2);
    expect(preview.readyCount).toBe(0);
  });

  it("detects duplicates in the file and against existing users", () => {
    const preview = previewCustomerImport(
      [
        header,
        ["علی", "رضایی", "09121111111", NID, "CARD1", "", "", "", "", "", ""],
        ["سارا", "محمدی", "09121111111", NID2, "", "", "", "", "", "", ""],
      ],
      { phones: ["09120000000"], nationalIds: [NID2], cards: ["CARD9"] }
    );
    const statuses = preview.rows.map((row) => row.status);
    expect(statuses).toContain("ready");
    expect(preview.duplicateCount).toBe(1);
    expect(preview.rows[1].message).toContain("تلفن");
  });

  it("ignores دارد/ندارد from the customers CSV export", () => {
    const preview = previewCustomerImport([
      ["نام", "نام خانوادگی", "تلفن", "کد ملی", "کارت", "باقی‌مانده"],
      ["علی", "رضایی", "09123334444", NID, "ندارد", "3"],
    ]);
    expect(preview.readyCount).toBe(1);
    const draft = readyImportDrafts(preview)[0];
    expect(draft.uidCart).toBe("");
    expect(draft.course?.sessions).toBe(3);
  });

  it("treats a file without headers as the template column order", () => {
    const preview = previewCustomerImport([
      ["مینا", "کاظمی", "09125556666", NID, "", "", "فلوت", "500000", "8", "", "0"],
    ]);
    expect(preview.usedDefaultHeaders).toBe(true);
    expect(preview.readyCount).toBe(1);
    expect(readyImportDrafts(preview)[0].firstName).toBe("مینا");
  });

  it("does not block a valid row because an earlier invalid row shared the phone", () => {
    const preview = previewCustomerImport([
      header,
      ["علی", "رضایی", "09121112222", "1111111111", "", "", "", "", "", "", ""],
      ["سارا", "محمدی", "09121112222", NID, "", "", "", "", "", "", ""],
    ]);
    expect(preview.errorCount).toBe(1);
    expect(preview.readyCount).toBe(1);
    expect(readyImportDrafts(preview)[0].firstName).toBe("سارا");
  });

  it("creates a user-only row when there is no course or payment", () => {
    const preview = previewCustomerImport([
      header,
      ["نیما", "احمدی", "09127778888", NID, "", "فقط تماس", "", "", "", "", ""],
    ]);
    const draft = readyImportDrafts(preview)[0];
    expect(draft.course).toBeNull();
    expect(draft.paidAmount).toBe(0);
    expect(draft.notes).toBe("فقط تماس");
  });
});
