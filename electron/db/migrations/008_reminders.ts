import { Migration } from "../types";

export const migration008: Migration = {
  version: 8,
  name: "reminder_logs",
  up: (db) => {
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS ReminderLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        kind TEXT NOT NULL,
        channel TEXT NOT NULL,
        sessionId INTEGER,
        message TEXT,
        dayKey TEXT NOT NULL,
        sentAt TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reminder_logs_day ON ReminderLogs(dayKey, kind, userId)`
    ).run();
  },
};
