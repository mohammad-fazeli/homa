// src/database/seed.ts
import { db } from "./"; // اتصال better-sqlite3
import { UserModel } from "./models/UserModel";
import { CourseModel } from "./models/CourseModel";
import { SessionModel } from "./models/SessionModel";

export function seedDatabase() {
  // اگر کاربر وجود دارد، seed اجرا نشود
  const userCount = (db.prepare("SELECT COUNT(*) AS c FROM Users").get() as any)
    .c;
  if (userCount > 0) return;

  console.log("🌱 Seeding development DB...");

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

  // ایجاد کاربران
  const createdUsers = sampleUsers.map((u) =>
    UserModel.create({
      firstName: u[0],
      lastName: u[1],
      phone: u[2],
      nationalId: u[3],
    })
  );

  const lastUser = createdUsers[14];
  const anotherUser = createdUsers[13];

  if (!lastUser) return;
  if (!anotherUser) return;

  // ایجاد دوره‌ها
  const course1 = CourseModel.create({
    userId: lastUser.id,
    cost: 400000,
    sessions: 0,
  });

  const course2 = CourseModel.create({
    userId: lastUser.id,
    cost: 500000,
    sessions: 10,
  });

  const course3 = CourseModel.create({
    userId: anotherUser.id,
    cost: 400000,
    sessions: 8,
  });

  console.log("✅ Seeding Completed");
}
