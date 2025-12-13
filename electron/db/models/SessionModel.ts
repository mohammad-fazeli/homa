import { db } from "../";
import {
  SessionCreateInput,
  SessionResult,
  SessionUpdateInput,
} from "../types";

function normalizeDate(input: string | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date input: " + input);
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

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

  deletesByCourseId(courseId: number) {
    db.prepare(`DELETE FROM Sessions WHERE courseId = ?`).run(courseId);
  },

  delete(id: number) {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  findAll(start: string | Date, end: string | Date): SessionResult[] {
    const startNormalized = normalizeDate(start);
    const endNormalized = normalizeDate(end);

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
      .all(startNormalized, endNormalized);

    return rows.map((row: any) => ({
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
    }));
  },
};
