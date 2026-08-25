import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { runMigrations } from "./migrate";

dotenv.config();

export let db!: Database.Database;

export function initDatabase() {
  if (db) return;

  const dbPath = path.join(app.getPath("userData"), "database.sqlite");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations();
}
