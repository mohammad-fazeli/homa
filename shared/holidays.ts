import {
  localDayKey,
  parseFlexibleDate,
  saturdayWeekdayIndex,
  toEnglishDigits,
  WEEKDAY_LABELS,
} from "./dates";

export type ClosedDayReason = "weekday" | "holiday";

export type ClosedDayHit = {
  dayKey: string;
  reason: ClosedDayReason;
  title: string;
};

export type HolidayLike = {
  dayKey: string;
  title?: string | null;
};

export function parseDayKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = toEnglishDigits(String(value)).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return raw;
}

export function dayKeyToDate(dayKey: string): Date | null {
  const parsed = parseDayKey(dayKey);
  if (!parsed) return null;
  const [year, month, day] = parsed.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dayKeyFromValue(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const onlyDay = parseDayKey(value.trim());
    if (onlyDay) return onlyDay;
  }
  const parsed = parseFlexibleDate(value);
  if (!parsed) return null;
  return localDayKey(parsed);
}

export function normalizeClosedWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => Number(item)))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
}

export function holidayConflict(
  date: Date | string,
  holidays: HolidayLike[],
  closedWeekdays: number[] = []
): ClosedDayHit | null {
  const dayKey = dayKeyFromValue(date);
  if (!dayKey) return null;

  const named = holidays.find((item) => item.dayKey === dayKey);
  if (named) {
    return {
      dayKey,
      reason: "holiday",
      title: named.title?.trim() || "تعطیل",
    };
  }

  const parsed = dayKeyToDate(dayKey) ?? parseFlexibleDate(date);
  if (!parsed) return null;
  const weekday = saturdayWeekdayIndex(parsed);
  if (closedWeekdays.includes(weekday)) {
    return {
      dayKey,
      reason: "weekday",
      title: WEEKDAY_LABELS[weekday] ?? "تعطیل هفتگی",
    };
  }
  return null;
}

export function isClosedDay(
  date: Date | string,
  holidays: HolidayLike[],
  closedWeekdays: number[] = []
): boolean {
  return holidayConflict(date, holidays, closedWeekdays) != null;
}

export function closedDayLabel(hit: ClosedDayHit): string {
  if (hit.reason === "weekday") return `تعطیل (${hit.title})`;
  return hit.title && hit.title !== "تعطیل" ? `تعطیل: ${hit.title}` : "تعطیل";
}

export function closedDayMessage(hit: ClosedDayHit): string {
  if (hit.reason === "weekday") {
    return `رزرو در روز تعطیل مجاز نیست (${hit.title})`;
  }
  return hit.title && hit.title !== "تعطیل"
    ? `رزرو در روز تعطیل مجاز نیست: ${hit.title}`
    : "رزرو در روز تعطیل مجاز نیست";
}
