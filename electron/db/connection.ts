import Database from "better-sqlite3";
import { runMigrations } from "./migrate";

export let db!: Database.Database;
export let databasePath = ":memory:";

export function openDatabase(dbPath: string) {
  if (db) {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }

  databasePath = dbPath;
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  runMigrations();
  return db;
}

export function closeDatabase() {
  if (!db) return;
  try {
    db.close();
  } catch {
    /* already closed */
  }
  db = undefined as unknown as Database.Database;
}

export function isDatabaseOpen() {
  return Boolean(db);
}
