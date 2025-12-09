// src/database/tables.ts
import { db } from "./index";

export function createTables() {
  db.prepare(
    `
    PRAGMA foreign_keys = ON;
  `
  ).run();

  // =============================
  // USERS
  // =============================
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      nationalId TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
  ).run();

  // =============================
  // COURSES  (belongsTo(User))
  // =============================
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS Courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      cost INTEGER NOT NULL,
      sessions INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId)
        REFERENCES Users(id)
        ON DELETE CASCADE
    );
  `
  ).run();

  // =============================
  // SESSIONS  (belongsTo(Course))
  // =============================
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS Sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId INTEGER NOT NULL,
      date DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      usedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courseId)
        REFERENCES Courses(id)
        ON DELETE CASCADE
    );
  `
  ).run();

  // =============================
  // SESSION LOGS  (belongsTo(User))
  // =============================
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS SessionLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      change INTEGER NOT NULL,
      previousValue INTEGER NOT NULL,
      newValue INTEGER NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId)
        REFERENCES Users(id)
        ON DELETE CASCADE
    );
  `
  ).run();
}
