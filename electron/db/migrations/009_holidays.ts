import { Migration } from "../types";

export const migration009: Migration = {
  version: 9,
  name: "academy_holidays",
  up: (db) => {
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS AcademyHolidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dayKey TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL DEFAULT '',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_academy_holidays_day ON AcademyHolidays(dayKey)`
    ).run();

    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS AcademyHolidaySettings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        closedWeekdays TEXT NOT NULL DEFAULT '[]',
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `INSERT OR IGNORE INTO AcademyHolidaySettings (id, closedWeekdays) VALUES (1, '[]')`
    ).run();
  },
};
