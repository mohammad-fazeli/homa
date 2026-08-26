import { Migration } from "../types";

export const migration005: Migration = {
  version: 5,
  name: "academy_multiclass",
  up: (db) => {
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS Rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#14635c',
        capacity INTEGER NOT NULL DEFAULT 8,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS Instructors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT,
        color TEXT NOT NULL DEFAULT '#c4893a',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS CourseTemplates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sessions INTEGER NOT NULL DEFAULT 8,
        cost INTEGER NOT NULL DEFAULT 0,
        durationMinutes INTEGER NOT NULL DEFAULT 60,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    ).run();

    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS Payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        courseId INTEGER,
        amount INTEGER NOT NULL,
        method TEXT NOT NULL DEFAULT 'cash',
        note TEXT,
        paidAt TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE SET NULL
      )
    `
    ).run();

    const addColumn = (table: string, column: string, ddl: string) => {
      const columns = db
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Array<{ name: string }>;
      if (columns.some((item) => item.name === column)) return;
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${ddl}`).run();
    };

    addColumn("Users", "notes", "notes TEXT");
    addColumn("Courses", "title", "title TEXT");
    addColumn("Courses", "roomId", "roomId INTEGER");
    addColumn("Courses", "instructorId", "instructorId INTEGER");
    addColumn("Courses", "templateId", "templateId INTEGER");
    addColumn("Courses", "expiresAt", "expiresAt TEXT");
    addColumn("Courses", "notes", "notes TEXT");
    addColumn("Sessions", "status", "status TEXT DEFAULT 'scheduled'");
    addColumn("Sessions", "roomId", "roomId INTEGER");
    addColumn("Sessions", "instructorId", "instructorId INTEGER");
    addColumn("Sessions", "notes", "notes TEXT");

    const roomCount = (
      db.prepare(`SELECT COUNT(*) AS count FROM Rooms`).get() as {
        count: number;
      }
    ).count;
    if (roomCount === 0) {
      db.prepare(
        `
        INSERT INTO Rooms (name, color, capacity) VALUES
          ('کلاس ۱', '#14635c', 8),
          ('کلاس ۲', '#c4893a', 8),
          ('کلاس ۳', '#3d5a80', 12)
      `
      ).run();
    }

    const templateCount = (
      db.prepare(`SELECT COUNT(*) AS count FROM CourseTemplates`).get() as {
        count: number;
      }
    ).count;
    if (templateCount === 0) {
      db.prepare(
        `
        INSERT INTO CourseTemplates (name, sessions, cost, durationMinutes) VALUES
          ('پکیج ۸ جلسه', 8, 0, 60),
          ('پکیج ۱۲ جلسه', 12, 0, 60)
      `
      ).run();
    }

    const defaultRoom = db
      .prepare(`SELECT id FROM Rooms ORDER BY id ASC LIMIT 1`)
      .get() as { id: number } | undefined;
    if (defaultRoom) {
      db.prepare(
        `UPDATE Courses SET roomId = ? WHERE roomId IS NULL`
      ).run(defaultRoom.id);
      db.prepare(
        `UPDATE Sessions SET roomId = COALESCE(roomId, ?) WHERE roomId IS NULL`
      ).run(defaultRoom.id);
    }

    db.prepare(
      `
      UPDATE Sessions
      SET status = CASE WHEN used = 1 THEN 'present' ELSE 'scheduled' END
      WHERE status IS NULL OR TRIM(status) = ''
    `
    ).run();

    db.prepare(
      `
      UPDATE Courses
      SET title = CASE
        WHEN title IS NULL OR TRIM(title) = '' THEN 'دوره'
        ELSE title
      END
    `
    ).run();

    const paymentCount = (
      db.prepare(`SELECT COUNT(*) AS count FROM Payments`).get() as {
        count: number;
      }
    ).count;
    if (paymentCount === 0) {
      db.prepare(
        `
        INSERT INTO Payments (userId, courseId, amount, method, note, paidAt, createdAt, updatedAt)
        SELECT userId, id, cost, 'cash', 'مانده از قبل', createdAt, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM Courses
        WHERE cost > 0
      `
      ).run();
    }

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_sessions_date ON Sessions(date)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_sessions_room ON Sessions(roomId, date)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_payments_user ON Payments(userId)`
    ).run();
  },
};
