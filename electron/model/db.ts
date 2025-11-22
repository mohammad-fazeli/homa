import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";

const dbPath = path.join(app.getPath("userData"), "database.sqlite");

export const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  nationalId TEXT UNIQUE NOT NULL,
  sessions INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS SessionLogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  change INTEGER NOT NULL,
  previousValue INTEGER NOT NULL,
  newValue INTEGER NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
`);
