import { parseFlexibleDate } from "../../../shared/dates";
import { Migration } from "../types";

export const migration003: Migration = {
  version: 3,
  name: "normalize_session_dates",
  up: (db) => {
    const rows = db
      .prepare(`SELECT id, date, usedAt FROM Sessions`)
      .all() as Array<{ id: number; date: string; usedAt: string | null }>;

    const update = db.prepare(
      `UPDATE Sessions SET date = ?, usedAt = ? WHERE id = ?`
    );

    for (const row of rows) {
      const date = parseFlexibleDate(row.date);
      const usedAt = parseFlexibleDate(row.usedAt);
      if (!date) continue;
      update.run(
        date.toISOString(),
        usedAt ? usedAt.toISOString() : null,
        row.id
      );
    }
  },
};
