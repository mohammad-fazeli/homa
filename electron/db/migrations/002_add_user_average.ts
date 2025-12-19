// src/database/migrations/002_add_user_average.ts
import { Migration } from "../types";

export const migration002: Migration = {
  version: 2,
  name: "add_users_average",
  up: (db) => {
    db.prepare(
      `
      ALTER TABLE Users
      ADD COLUMN average REAL DEFAULT 0;
    `
    ).run();
  },
};
