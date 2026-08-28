import path from "path";
import { app } from "electron";
import dotenv from "dotenv";
import { openDatabase, db, databasePath, closeDatabase, isDatabaseOpen } from "./connection";

dotenv.config();

export { db, databasePath, closeDatabase, isDatabaseOpen };

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
