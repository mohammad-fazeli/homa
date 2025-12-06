import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const dbPath = path.join(app.getPath("userData"), "database.sqlite");

if (process.env.NODE_ENV === "development") {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}

export const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  nationalId TEXT UNIQUE NOT NULL
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

CREATE TABLE IF NOT EXISTS Courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  cost INTEGER NOT NULL,
  sessions INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courseId INTEGER NOT NULL,
  date DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  usedAt DATETIME DEFAULT NULL,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE
);
`);

if (process.env.NODE_ENV === "development") {
  seedDatabase();
}

function seedDatabase() {
  console.log("🌱 SEEDING DEVELOPMENT DATABASE...");

  // چک کنیم آیا قبلاً کاربری وجود دارد یا نه
  const userCount = (db.prepare("SELECT COUNT(*) AS c FROM Users").get() as any)
    .c;

  if (userCount > 0) {
    console.log("ℹ️ دیتابیس قبلاً مقداردهی شده.");
    return;
  }

  // --------------------
  // کاربران نمونه
  // --------------------
  const insertUser = db.prepare(`
    INSERT INTO Users (firstName, lastName, phone, nationalId)
    VALUES (?, ?, ?, ?)
  `);

  const sampleUsers = [
    ["علی", "محمدی", "09120000001", "0011223344"],
    ["نگین", "رضایی", "09120000002", "0055667788"],
    ["سارا", "کاظمی", "09120000003", "0099887766"],
    ["رضا", "احمدی", "09120000004", "0011223355"],
    ["مریم", "سعیدی", "09120000005", "0011223366"],
    ["امیر", "کریمی", "09120000006", "0011223377"],
    ["نازنین", "عسگری", "09120000007", "0011223388"],
    ["حمید", "موسوی", "09120000008", "0011223399"],
    ["الهام", "پیروی", "09120000009", "0011223400"],
    ["محمد", "نوروزی", "09120000010", "0011223411"],
    ["شایان", "مرادی", "09120000011", "0011223422"],
    ["یگانه", "قنبری", "09120000012", "0011223433"],
    ["آرمین", "طاهری", "09120000013", "0011223444"],
    ["پریناز", "قاسمی", "09120000014", "0011223455"],
    ["کیان", "مختاری", "09120000015", "0011223466"],
  ];

  const userIds = sampleUsers.map((u) => insertUser.run(...u).lastInsertRowid);

  // --------------------
  // دوره‌های نمونه
  // --------------------
  const insertCourse = db.prepare(`
    INSERT INTO Courses (userId, cost, sessions)
    VALUES (?, ?, ?)
  `);

  const courseIds = [
    insertCourse.run(userIds[14], 400000, 0).lastInsertRowid,
    insertCourse.run(userIds[14], 500000, 10).lastInsertRowid,
    insertCourse.run(userIds[13], 400000, 8).lastInsertRowid,
  ];

  // --------------------
  // جلسات نمونه
  // --------------------
  const insertSession = db.prepare(`
    INSERT INTO Sessions (courseId, date, used)
    VALUES (?, ?, ?)
  `);

  insertSession.run(courseIds[0], new Date().toISOString(), 0);
  insertSession.run(courseIds[0], new Date().toISOString(), 1);
  insertSession.run(courseIds[1], new Date().toISOString(), 0);
  insertSession.run(courseIds[1], new Date().toISOString(), 1);

  console.log("✅ SEEDING COMPLETED");
}
