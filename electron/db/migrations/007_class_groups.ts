import { Migration } from "../types";

export const migration007: Migration = {
  version: 7,
  name: "named_class_groups",
  up: (db) => {
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS ClassGroups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roomId INTEGER,
        instructorId INTEGER,
        templateId INTEGER,
        color TEXT NOT NULL DEFAULT '#14635c',
        notes TEXT,
        weekdays TEXT NOT NULL DEFAULT '[]',
        hour INTEGER,
        sessions INTEGER NOT NULL DEFAULT 8,
        cost INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS ClassGroupMembers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        courseId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(groupId, userId),
        FOREIGN KEY (groupId) REFERENCES ClassGroups(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE SET NULL
      )
    `
    ).run();

    const columns = db
      .prepare(`PRAGMA table_info(Courses)`)
      .all() as Array<{ name: string }>;
    if (!columns.some((item) => item.name === "groupId")) {
      db.prepare(`ALTER TABLE Courses ADD COLUMN groupId INTEGER`).run();
    }

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_group_members_group ON ClassGroupMembers(groupId)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_group_members_user ON ClassGroupMembers(userId)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_courses_group ON Courses(groupId)`
    ).run();
  },
};
