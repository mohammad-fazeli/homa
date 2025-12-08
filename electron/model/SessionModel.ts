import { db } from "./db";

export type Session = {
  id: number;
  courseId: number;
  date: Date;
  used?: number;
  usedAt?: Date | null;
};

export const SessionModel = {
  // ایجاد جلسه
  create(session: Omit<Session, "id">): Session {
    const stmt = db.prepare(`
      INSERT INTO Sessions (courseId, date, used, usedAt)
      VALUES (@courseId, @date, @used, @usedAt)
    `);

    const result = stmt.run(session);

    return db
      .prepare(`SELECT * FROM Sessions WHERE id = ?`)
      .get(result.lastInsertRowid) as Session;
  },

  // گرفتن جلسه با آی‌دی
  findById(id: number): Session | undefined {
    return db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(id) as Session;
  },

  // گرفتن تمام جلسات یک دوره
  findByCourse(courseId: number): Session[] {
    return db
      .prepare(
        `
      SELECT * FROM Sessions
      WHERE courseId = ?
      ORDER BY date ASC
    `
      )
      .all(courseId) as Session[];
  },

  // گرفتن تمام جلسات یک کاربر (از طریق join با Courses)
  findByUser(userId: number): Session[] {
    return db
      .prepare(
        `
      SELECT s.*
      FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      WHERE c.userId = ?
      ORDER BY s.date ASC
    `
      )
      .all(userId) as Session[];
  },

  // جلسات استفاده‌نشده (used = 0)
  findUnused(): Session[] {
    return db
      .prepare(
        `
      SELECT * FROM Sessions
      WHERE used = 0
      ORDER BY date ASC
    `
      )
      .all() as Session[];
  },

  // جلسات استفاده‌نشده یک کاربر
  findUnusedByUser(userId: number): Session[] {
    return db
      .prepare(
        `
      SELECT s.*
      FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      WHERE c.userId = ? AND s.used = 0
      ORDER BY s.date ASC
    `
      )
      .all(userId) as Session[];
  },

  // نشانه‌گذاری جلسه به عنوان استفاده‌شده
  markUsed(id: number): Session | undefined {
    db.prepare(
      `
      UPDATE Sessions
      SET used = 1,
          usedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(id);

    return this.findById(id);
  },

  // آپدیت اطلاعات جلسه
  update(id: number, data: Partial<Omit<Session, "id">>): Session | undefined {
    const fields = Object.keys(data)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    db.prepare(
      `
      UPDATE Sessions
      SET ${fields}
      WHERE id = @id
    `
    ).run({ id, ...data });

    return this.findById(id);
  },

  // حذف جلسه
  delete(id: number): void {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  // گرفتن همه جلسات
  all(): Session[] {
    return db
      .prepare(`SELECT * FROM Sessions ORDER BY date ASC`)
      .all() as Session[];
  },
};
