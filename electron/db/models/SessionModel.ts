import { db } from "../";
import {
  SessionCreateInput,
  SessionResult,
  SessionUpdateInput,
} from "../types";

export const SessionModel = {
  create(data: SessionCreateInput): SessionResult {
    const stmt = db.prepare(`
      INSERT INTO Sessions (courseId, date, used, usedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      data.courseId,
      data.date,
      data.used ?? 0,
      data.usedAt ?? null
    );

    return this.findById(result.lastInsertRowid as number)!;
  },

  findById(id: number): SessionResult {
    const row: any = db
      .prepare(
        `
      SELECT 
        s.id,
        s.courseId,
        s.date,
        s.used,
        s.usedAt,
        s.createdAt,
        s.updatedAt,
        c.userId,
        u.firstName,
        u.lastName
      FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      JOIN Users u ON c.userId = u.id
      WHERE s.id = ?
      LIMIT 1
      `
      )
      .get(id);

    if (!row) {
      throw new Error("Session not found");
    }

    return {
      id: row.id,
      courseId: row.courseId,
      date: row.date,
      used: row.used,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      userId: row.userId,
      title: `${row.firstName} ${row.lastName}`,
      start: new Date(row.date),
    };
  },

  findByTime(userId: number, start: string | Date, end: string | Date) {
    console.log("🚀 ~ end:", end);
    console.log("🚀 ~ start:", start);
    const sessions = this.findAll(start, end);
    console.log("🚀 ~ sessions:", sessions);

    return sessions.find((s) => s.userId === userId && s.used === 0);
  },

  update(courseId: number, data: SessionUpdateInput[]) {
    this.deletesByCourseId(courseId);
    for (const session of data) {
      this.create({
        courseId: courseId,
        date: session.date,
        used: session.used,
        usedAt: session.usedAt,
      });
    }
  },

  useSession(id: number, usedAt: string) {
    db.prepare(
      `
      UPDATE Sessions
      SET used = 1,
          usedAt = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(usedAt, id);
  },

  deletesByCourseId(courseId: number) {
    db.prepare(`DELETE FROM Sessions WHERE courseId = ?`).run(courseId);
  },

  delete(id: number) {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  findAll(start: string | Date, end: string | Date): SessionResult[] {
    const rows = db
      .prepare(
        `
      SELECT 
        s.id,
        s.courseId,
        s.date,
        s.used,
        s.usedAt,
        s.createdAt,
        s.updatedAt,
        c.userId,
        u.firstName,
        u.lastName
      FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      JOIN Users u ON c.userId = u.id
      WHERE s.date BETWEEN ? AND ?
      ORDER BY s.date ASC
      `
      )
      .all(start, end);

    return rows.map((row: any) => {
      return {
        id: row.id,
        courseId: row.courseId,
        date: row.date,
        used: row.used,
        usedAt: row.usedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,

        userId: row.userId,
        title: `${row.firstName} ${row.lastName}`,
        start: new Date(row.date),
      };
    });
  },
};
