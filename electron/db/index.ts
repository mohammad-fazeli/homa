// src/database/index.ts
import path from "path";
import { app } from "electron";
import { Sequelize } from "sequelize";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const dbPath = path.join(app.getPath("userData"), "database.sqlite");

// حذف دیتابیس در حالت dev (مثل کد قبلی)
if (process.env.NODE_ENV === "development") {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false,
});

// مدل‌ها
import "./models/User";
import "./models/Course";
import "./models/Session";
import "./models/SessionLog";
import { seedDatabase } from "./seed";

import { setupAssociations } from "./associations";

export async function initDatabase() {
  setupAssociations();
  await sequelize.sync({ alter: true });

  if (process.env.NODE_ENV === "development") {
    await seedDatabase();
  }
}
