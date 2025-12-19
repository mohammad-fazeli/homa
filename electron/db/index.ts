// src/database/index.ts
import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = path.join(app.getPath("userData"), "database.sqlite");

export const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

import { runMigrations } from "./migrate";

export function initDatabase() {
  runMigrations();
}
