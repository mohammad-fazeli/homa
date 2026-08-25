import { Migration } from "../types";

export const migration004: Migration = {
  version: 4,
  name: "drop_users_average",
  up: (db) => {
    const columns = db
      .prepare(`PRAGMA table_info(Users)`)
      .all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "average")) return;
    db.prepare(`ALTER TABLE Users DROP COLUMN average`).run();
  },
};
