// src/database/migrations/001_init.ts
import { Migration } from "../types";

export const migration001: Migration = {
  version: 1,
  name: "init_database",
  up: (db) => {
    db.prepare(
      `
      CREATE TABLE Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        nationalId TEXT NOT NULL UNIQUE,
        uidCart TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE Courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        sessions INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      );
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE Sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        date DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        usedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE
      );
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE SessionLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        change INTEGER NOT NULL,
        previousValue INTEGER NOT NULL,
        newValue INTEGER NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      );
    `
    ).run();
  },
};
