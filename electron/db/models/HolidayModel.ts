import { db } from "../connection";
import {
  closedDayMessage,
  holidayConflict,
  normalizeClosedWeekdays,
  parseDayKey,
} from "../../../shared/holidays";
import { parseFlexibleDate, sameHour } from "../../../shared/dates";
import { parseWeekdays, serializeWeekdays } from "../../../shared/groups";
import type { AcademyHoliday, AcademyHolidayWriteInput } from "../types";

function mapHoliday(row: any): AcademyHoliday {
  return {
    id: row.id,
    dayKey: row.dayKey,
    title: row.title ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function loadClosedWeekdays(): number[] {
  try {
    const row = db
      .prepare(`SELECT closedWeekdays FROM AcademyHolidaySettings WHERE id = 1`)
      .get() as { closedWeekdays?: string } | undefined;
    return normalizeClosedWeekdays(parseWeekdays(row?.closedWeekdays ?? "[]"));
  } catch {
    return [];
  }
}

export const HolidayModel = {
  list(): AcademyHoliday[] {
    return db
      .prepare(`SELECT * FROM AcademyHolidays ORDER BY dayKey ASC`)
      .all()
      .map(mapHoliday);
  },

  findById(id: number): AcademyHoliday | null {
    const row = db.prepare(`SELECT * FROM AcademyHolidays WHERE id = ?`).get(id);
    return row ? mapHoliday(row) : null;
  },

  rules() {
    return {
      holidays: this.list(),
      closedWeekdays: loadClosedWeekdays(),
    };
  },

  setClosedWeekdays(value: unknown): number[] {
    const closedWeekdays = normalizeClosedWeekdays(value);
    db.prepare(
      `
      INSERT INTO AcademyHolidaySettings (id, closedWeekdays, updatedAt)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        closedWeekdays = excluded.closedWeekdays,
        updatedAt = CURRENT_TIMESTAMP
    `
    ).run(serializeWeekdays(closedWeekdays));
    return closedWeekdays;
  },

  assertOpenDates(
    dates: Array<string | Date>,
    options: { ignoreDates?: Array<string | Date> } = {}
  ) {
    const { holidays, closedWeekdays } = this.rules();
    const ignore = (options.ignoreDates ?? [])
      .map((value) => parseFlexibleDate(value))
      .filter((value): value is Date => Boolean(value));

    for (const date of dates) {
      const parsed = parseFlexibleDate(date);
      if (!parsed) continue;
      if (ignore.some((kept) => sameHour(kept, parsed))) continue;
      const hit = holidayConflict(parsed, holidays, closedWeekdays);
      if (hit) throw new Error(closedDayMessage(hit));
    }
  },

  save(data: AcademyHolidayWriteInput): AcademyHoliday {
    const dayKey = parseDayKey(data.dayKey);
    if (!dayKey) throw new Error("تاریخ تعطیل نامعتبر است");
    const title = data.title?.trim() || "تعطیل";

    const duplicate = db
      .prepare(`SELECT id FROM AcademyHolidays WHERE dayKey = ?`)
      .get(dayKey) as { id: number } | undefined;
    if (duplicate && duplicate.id !== data.id) {
      throw new Error("این روز از قبل به‌عنوان تعطیل ثبت شده");
    }

    if (data.id && data.id > 0) {
      const existing = this.findById(data.id);
      if (!existing) throw new Error("تعطیل پیدا نشد");
      db.prepare(
        `
        UPDATE AcademyHolidays
        SET dayKey = ?, title = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(dayKey, title, data.id);
      return this.findById(data.id)!;
    }

    const result = db
      .prepare(
        `
        INSERT INTO AcademyHolidays (dayKey, title, createdAt, updatedAt)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(dayKey, title);
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM AcademyHolidays WHERE id = ?`).run(id).changes;
  },
};
