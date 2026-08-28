import { parseToman } from "./finance";
import { toEnglishDigits } from "./dates";
import {
  isValidNationalId,
  isValidPhone,
  normalizeNationalId,
  normalizePhone,
} from "./validation";

export const CUSTOMER_IMPORT_MAX_ROWS = 2000;

export const CUSTOMER_IMPORT_TEMPLATE_HEADERS = [
  "نام",
  "نام خانوادگی",
  "تلفن",
  "کد ملی",
  "کارت",
  "یادداشت",
  "دوره",
  "هزینه",
  "جلسات",
  "باقی‌مانده",
  "پرداخت",
] as const;

export const CUSTOMER_IMPORT_SAMPLE_ROW = [
  "علی",
  "رضایی",
  "09121234567",
  "0123456789",
  "",
  "",
  "پیانو",
  "2400000",
  "12",
  "8",
  "1200000",
];

export type CustomerImportField =
  | "firstName"
  | "lastName"
  | "fullName"
  | "phone"
  | "nationalId"
  | "uidCart"
  | "notes"
  | "title"
  | "cost"
  | "sessions"
  | "remaining"
  | "paidAmount";

export const CUSTOMER_IMPORT_FIELD_LABELS: Record<CustomerImportField, string> = {
  firstName: "نام",
  lastName: "نام خانوادگی",
  fullName: "نام کامل",
  phone: "تلفن",
  nationalId: "کد ملی",
  uidCart: "کارت",
  notes: "یادداشت",
  title: "دوره",
  cost: "هزینه",
  sessions: "جلسات",
  remaining: "باقی‌مانده",
  paidAmount: "پرداخت",
};

const HEADER_ALIASES: Record<string, CustomerImportField> = {
  نام: "firstName",
  name: "firstName",
  firstname: "firstName",
  first: "firstName",
  نامکوچک: "firstName",
  اسم: "firstName",
  نامخانوادگی: "lastName",
  lastname: "lastName",
  last: "lastName",
  family: "lastName",
  familyname: "lastName",
  فامیل: "lastName",
  نامخانوادگي: "lastName",
  نامکامل: "fullName",
  نامونامخانوادگی: "fullName",
  نامنامخانوادگی: "fullName",
  fullname: "fullName",
  studentname: "fullName",
  مشتری: "fullName",
  تلفن: "phone",
  موبایل: "phone",
  همراه: "phone",
  شماره: "phone",
  شمارهتلفن: "phone",
  شمارهموبایل: "phone",
  تلفنهمراه: "phone",
  phone: "phone",
  mobile: "phone",
  tel: "phone",
  cellphone: "phone",
  کدملی: "nationalId",
  کدملی۱۰رقمی: "nationalId",
  nationalid: "nationalId",
  nationalcode: "nationalId",
  nid: "nationalId",
  کارت: "uidCart",
  شمارهکارت: "uidCart",
  کارترfid: "uidCart",
  rfid: "uidCart",
  uid: "uidCart",
  uidcart: "uidCart",
  card: "uidCart",
  یادداشت: "notes",
  توضیحات: "notes",
  notes: "notes",
  note: "notes",
  دوره: "title",
  عنوان: "title",
  عنواندوره: "title",
  نامدوره: "title",
  title: "title",
  course: "title",
  هزینه: "cost",
  هزینهدوره: "cost",
  شهریه: "cost",
  مبلغ: "cost",
  قیمت: "cost",
  cost: "cost",
  price: "cost",
  جلسات: "sessions",
  تعدادجلسه: "sessions",
  تعدادجلسات: "sessions",
  sessions: "sessions",
  sessioncount: "sessions",
  باقیمانده: "remaining",
  باقیماندهجلسه: "remaining",
  اعتبار: "remaining",
  remaining: "remaining",
  credit: "remaining",
  پرداخت: "paidAmount",
  پرداختشده: "paidAmount",
  مبلغپرداختی: "paidAmount",
  paid: "paidAmount",
  paidamount: "paidAmount",
};

export type CustomerImportExisting = {
  phones?: Iterable<string>;
  nationalIds?: Iterable<string>;
  cards?: Iterable<string>;
};

export type CustomerImportDraft = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
  notes: string | null;
  course: {
    title: string;
    cost: number;
    sessions: number;
    notes: string | null;
  } | null;
  paidAmount: number;
};

export type CustomerImportRowStatus = "ready" | "error" | "duplicate" | "empty";

export type CustomerImportRow = {
  rowNumber: number;
  status: CustomerImportRowStatus;
  message: string;
  draft: CustomerImportDraft | null;
};

export type CustomerImportPreview = {
  usedDefaultHeaders: boolean;
  mappedFields: CustomerImportField[];
  missingRequired: string[];
  rows: CustomerImportRow[];
  readyCount: number;
  errorCount: number;
  duplicateCount: number;
  emptyCount: number;
};

export type CustomerImportCommitResult = {
  imported: number;
  skipped: number;
  failed: Array<{ rowNumber: number; message: string }>;
};

export function foldImportHeader(value: string): string {
  return toEnglishDigits(value)
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/باقی‌مانده/g, "باقیمانده")
    .replace(/باقی مانده/g, "باقیمانده")
    .replace(/[\s_\-–—./\\()]+/g, "")
    .toLowerCase();
}

export function resolveImportHeader(value: string): CustomerImportField | null {
  const key = foldImportHeader(value);
  return HEADER_ALIASES[key] ?? null;
}

export function mapImportHeaders(
  headerRow: string[]
): Partial<Record<CustomerImportField, number>> {
  const mapped: Partial<Record<CustomerImportField, number>> = {};
  headerRow.forEach((cell, index) => {
    const field = resolveImportHeader(String(cell ?? ""));
    if (field && mapped[field] === undefined) mapped[field] = index;
  });
  return mapped;
}

export function splitFullName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function coerceImportPhone(raw: string): string {
  let value = expandScientific(toEnglishDigits(raw)).replace(/[\s\-()]/g, "");
  if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("0098")) value = value.slice(4);
  else if (value.startsWith("98") && value.length >= 12) value = value.slice(2);
  if (/^9\d{9}$/.test(value)) value = `0${value}`;
  return normalizePhone(value);
}

export function coerceImportNationalId(raw: string): string {
  let value = expandScientific(toEnglishDigits(raw)).replace(/[\s-]/g, "");
  if (/^\d{8,9}$/.test(value)) value = value.padStart(10, "0");
  return normalizeNationalId(value);
}

export function isPlaceholderCard(value: string): boolean {
  return /^(دارد|ندارد|yes|no|true|false|null|undefined|-|—|–)$/i.test(
    value.trim()
  );
}

export function previewCustomerImport(
  table: string[][],
  existing?: CustomerImportExisting
): CustomerImportPreview {
  const rows = table.map((row) => (row ?? []).map((cell) => String(cell ?? "").trim()));
  const headerIndex = rows.findIndex((row) => row.some(Boolean));
  if (headerIndex < 0) {
    return emptyPreview(["تلفن", "نام", "کد ملی"]);
  }

  const firstRow = rows[headerIndex];
  const mappedFromFirst = mapImportHeaders(firstRow);
  const usedDefaultHeaders = Object.keys(mappedFromFirst).length === 0;
  const mapped = usedDefaultHeaders
    ? mapImportHeaders([...CUSTOMER_IMPORT_TEMPLATE_HEADERS])
    : mappedFromFirst;
  const mappedFields = (Object.keys(mapped) as CustomerImportField[]).sort();
  const missingRequired: string[] = [];
  if (mapped.phone === undefined) missingRequired.push("تلفن");
  if (
    mapped.firstName === undefined &&
    mapped.lastName === undefined &&
    mapped.fullName === undefined
  ) {
    missingRequired.push("نام");
  }
  if (mapped.nationalId === undefined) missingRequired.push("کد ملی");

  const phones = new Set<string>();
  const nationalIds = new Set<string>();
  const cards = new Set<string>();
  for (const phone of existing?.phones ?? []) {
    const value = coerceImportPhone(phone);
    if (value) phones.add(value);
  }
  for (const id of existing?.nationalIds ?? []) {
    const value = coerceImportNationalId(id);
    if (value) nationalIds.add(value);
  }
  for (const card of existing?.cards ?? []) {
    const value = String(card ?? "").trim();
    if (value && !isPlaceholderCard(value)) cards.add(value);
  }

  const start = usedDefaultHeaders ? headerIndex : headerIndex + 1;
  const resultRows: CustomerImportRow[] = [];
  let readyCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  let emptyCount = 0;
  let dataRows = 0;

  for (let index = start; index < rows.length; index++) {
    const rowNumber = index + 1;
    const row = rows[index];
    if (!row.some(Boolean)) {
      emptyCount += 1;
      resultRows.push({
        rowNumber,
        status: "empty",
        message: "",
        draft: null,
      });
      continue;
    }

    dataRows += 1;
    if (dataRows > CUSTOMER_IMPORT_MAX_ROWS) {
      errorCount += 1;
      resultRows.push({
        rowNumber,
        status: "error",
        message: `حداکثر ${CUSTOMER_IMPORT_MAX_ROWS} ردیف در هر فایل مجاز است`,
        draft: null,
      });
      continue;
    }

    if (missingRequired.length) {
      errorCount += 1;
      resultRows.push({
        rowNumber,
        status: "error",
        message: `ستون‌های لازم پیدا نشد: ${missingRequired.join("، ")}`,
        draft: null,
      });
      continue;
    }

    const parsed = parseDataRow(row, mapped, rowNumber);
    if (parsed.status !== "ready" || !parsed.draft) {
      if (parsed.status === "duplicate") duplicateCount += 1;
      else errorCount += 1;
      resultRows.push(parsed);
      continue;
    }

    const clash = duplicateMessage(parsed.draft, phones, nationalIds, cards);
    if (clash) {
      duplicateCount += 1;
      resultRows.push({
        rowNumber,
        status: "duplicate",
        message: clash,
        draft: parsed.draft,
      });
      continue;
    }

    readyCount += 1;
    resultRows.push(parsed);
    rememberKeys(parsed.draft, phones, nationalIds, cards);
  }

  return {
    usedDefaultHeaders,
    mappedFields,
    missingRequired,
    rows: resultRows,
    readyCount,
    errorCount,
    duplicateCount,
    emptyCount,
  };
}

export function readyImportDrafts(preview: CustomerImportPreview): CustomerImportDraft[] {
  return preview.rows
    .filter((row) => row.status === "ready" && row.draft)
    .map((row) => row.draft as CustomerImportDraft);
}

function emptyPreview(missingRequired: string[]): CustomerImportPreview {
  return {
    usedDefaultHeaders: false,
    mappedFields: [],
    missingRequired,
    rows: [],
    readyCount: 0,
    errorCount: 0,
    duplicateCount: 0,
    emptyCount: 0,
  };
}

function parseDataRow(
  row: string[],
  mapped: Partial<Record<CustomerImportField, number>>,
  rowNumber: number
): CustomerImportRow {
  const cell = (field: CustomerImportField) => {
    const index = mapped[field];
    return index === undefined ? "" : String(row[index] ?? "").trim();
  };

  let firstName = clip(cell("firstName"), 80);
  let lastName = clip(cell("lastName"), 80);
  const fullName = cell("fullName");
  if (!firstName && !lastName && fullName) {
    const split = splitFullName(fullName);
    firstName = clip(split.firstName, 80);
    lastName = clip(split.lastName, 80);
  } else if (firstName && !lastName) {
    lastName = "-";
  }

  const phone = coerceImportPhone(cell("phone"));
  const nationalId = coerceImportNationalId(cell("nationalId"));
  const rawCard = cell("uidCart");
  const uidCart = isPlaceholderCard(rawCard) ? "" : clip(rawCard, 64);
  const notes = clip(cell("notes"), 2000) || null;
  const title = clip(cell("title"), 80);
  const cost = Math.max(0, parseToman(cell("cost")));
  const sessions = Math.max(0, parseToman(cell("sessions")));
  const remainingRaw = cell("remaining");
  const remainingSpecified = remainingRaw !== "";
  const remaining = remainingSpecified ? Math.max(0, parseToman(remainingRaw)) : 0;
  const paidAmount = Math.max(0, parseToman(cell("paidAmount")));
  const credit = remainingSpecified ? remaining : sessions;

  const errors: string[] = [];
  if (!firstName) errors.push("نام الزامی است");
  if (!isValidPhone(phone)) errors.push("شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود");
  if (!isValidNationalId(nationalId)) errors.push("کد ملی نامعتبر است");

  const courseNotes: string[] = [];
  if (remainingSpecified && sessions > credit) {
    courseNotes.push(`قرارداد قبلی ${sessions} جلسه`);
  }
  const shouldCreateCourse = cost > 0 || credit > 0;
  const course = shouldCreateCourse
    ? {
        title: title || "دوره",
        cost,
        sessions: credit,
        notes: courseNotes.length ? courseNotes.join(" — ") : null,
      }
    : null;

  const draft: CustomerImportDraft = {
    rowNumber,
    firstName,
    lastName: lastName || "-",
    phone,
    nationalId,
    uidCart,
    notes,
    course,
    paidAmount,
  };

  if (errors.length) {
    return {
      rowNumber,
      status: "error",
      message: errors.join(" — "),
      draft,
    };
  }

  return {
    rowNumber,
    status: "ready",
    message: "",
    draft,
  };
}

function duplicateMessage(
  draft: CustomerImportDraft,
  phones: Set<string>,
  nationalIds: Set<string>,
  cards: Set<string>
) {
  if (draft.phone && phones.has(draft.phone)) {
    return "این شماره تلفن قبلاً ثبت شده است";
  }
  if (draft.nationalId && nationalIds.has(draft.nationalId)) {
    return "این کد ملی قبلاً ثبت شده است";
  }
  if (draft.uidCart && cards.has(draft.uidCart)) {
    return "این کارت قبلاً برای کاربر دیگری ثبت شده است";
  }
  return "";
}

function rememberKeys(
  draft: CustomerImportDraft | null,
  phones: Set<string>,
  nationalIds: Set<string>,
  cards: Set<string>
) {
  if (!draft) return;
  if (isValidPhone(draft.phone)) phones.add(draft.phone);
  if (isValidNationalId(draft.nationalId)) nationalIds.add(draft.nationalId);
  if (draft.uidCart) cards.add(draft.uidCart);
}

function clip(value: string, max: number) {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function expandScientific(raw: string): string {
  const value = raw.trim();
  if (!/^-?\d+(\.\d+)?e[+-]?\d+$/i.test(value)) return value;
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return String(Math.trunc(number));
}
