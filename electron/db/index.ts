import path from "path";
import { app } from "electron";
import dotenv from "dotenv";
import { openDatabase, db, databasePath, closeDatabase } from "./connection";

dotenv.config();

export { db, databasePath, closeDatabase };

export function getDatabasePath() {
  return path.join(app.getPath("userData"), "database.sqlite");
}

export function initDatabase() {
  openDatabase(getDatabasePath());
}

export function reopenDatabase() {
  closeDatabase();
  openDatabase(getDatabasePath());
}
