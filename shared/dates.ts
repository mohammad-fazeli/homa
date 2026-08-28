export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function parseFlexibleDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = toEnglishDigits(String(value).trim());
  if (!raw) return null;

  const isoTry = new Date(raw);
  if (!Number.isNaN(isoTry.getTime())) return isoTry;

  const normalized = raw
    .replace("،", ",")
    .replace(/\u200f|\u200e/g, "")
    .replace(/ق\.ظ\.?/g, "AM")
    .replace(/ب\.ظ\.?/g, "PM");

  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function toIsoDate(value: string | Date): string {
  const parsed = parseFlexibleDate(value);
  if (!parsed) {
    throw new Error("تاریخ نامعتبر است");
  }
  return parsed.toISOString();
}

export function sameHour(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

export function hourKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
}

/** Saturday = 0 … Friday = 6 (matches the academy calendar). */
export const WEEKDAY_LABELS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

export function saturdayWeekdayIndex(date: Date): number {
  return (date.getDay() + 1) % 7;
}

export function generateRecurringDates(options: {
  startDate: Date;
  weekdays: number[];
  hour: number;
  count: number;
  maxDays?: number;
  skipDate?: (date: Date) => boolean;
}): Date[] {
  const weekdays = [...new Set(options.weekdays)].filter(
    (day) => day >= 0 && day <= 6
  );
  if (weekdays.length === 0 || options.count <= 0) return [];

  const dates: Date[] = [];
  const cursor = new Date(options.startDate);
  cursor.setHours(0, 0, 0, 0);
  const maxDays = options.maxDays ?? Math.max(400, options.count * 14);
  let guard = 0;

  while (dates.length < options.count && guard < maxDays) {
    if (weekdays.includes(saturdayWeekdayIndex(cursor))) {
      const slot = new Date(cursor);
      slot.setHours(options.hour, 0, 0, 0);
      if (!options.skipDate?.(slot)) {
        dates.push(slot);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return dates;
}
