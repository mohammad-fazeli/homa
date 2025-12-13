// src/database/index.ts
import path from "path";
import { app } from "electron";
import fs from "fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = path.join(app.getPath("userData"), "database.sqlite");

// در حالت dev دیتابیس حذف می‌شود
if (process.env.NODE_ENV === "development") {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}

// اتصال به دیتابیس
export const db = new Database(dbPath);

// فعال کردن foreign keys
db.pragma("foreign_keys = ON");

import { createTables } from "./tables";
import { seedDatabase } from "./seed";

export function initDatabase() {
  createTables();

  if (process.env.NODE_ENV === "development") {
    // seedDatabase();
  }
}
