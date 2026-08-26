import { db } from "../connection";
import {
  SessionCreateInput,
  SessionResult,
  SessionUpdateInput,
} from "../types";
import { hasHourConflict } from "../../lib/session-match";

function mapSessionRow(row: any): SessionResult {
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

  findById(id: number): SessionResult | null {
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

    if (!row) return null;
    return mapSessionRow(row);
  },

  listAll(): Array<{ id: number; date: string | Date; courseId: number }> {
    return db.prepare(`SELECT id, date, courseId FROM Sessions`).all() as Array<{
      id: number;
      date: string | Date;
      courseId: number;
    }>;
  },

  assertNoConflicts(
    dates: Array<string | Date>,
    excludeIds: number[] = []
  ) {
    const existing = this.listAll();
    for (const date of dates) {
      if (hasHourConflict(existing, date, excludeIds)) {
        throw new Error("این ساعت قبلاً برای مشتری دیگری رزرو شده است");
      }
    }
  },

  update(courseId: number, data: SessionUpdateInput[]) {
    const existingIds = (
      db
        .prepare(`SELECT id FROM Sessions WHERE courseId = ?`)
        .all(courseId) as Array<{ id: number }>
    ).map((row) => row.id);

    this.assertNoConflicts(
      data.map((session) => session.date),
      existingIds
    );

    const sync = db.transaction(() => {
      this.deletesByCourseId(courseId);
      for (const session of data) {
        this.create({
          courseId,
          date: session.date,
          used: session.used,
          usedAt: session.usedAt,
        });
      }
    });
    sync();
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

  unuseSession(id: number) {
    db.prepare(
      `
      UPDATE Sessions
      SET used = 0,
          usedAt = NULL,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(id);
  },

  findLastUnused(userId: number) {
    const row: any = db
      .prepare(
        `
        SELECT s.*
        FROM Sessions s
        JOIN Courses c ON s.courseId = c.id
        WHERE c.userId = ? AND s.used = 0
        ORDER BY s.date DESC
        LIMIT 1
      `
      )
      .get(userId);
    return row ?? null;
  },

  deletesByCourseId(courseId: number) {
    db.prepare(`DELETE FROM Sessions WHERE courseId = ?`).run(courseId);
  },

  delete(id: number) {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  findUpcoming(limit = 8): SessionResult[] {
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
      WHERE s.used = 0 AND datetime(s.date) >= datetime('now')
      ORDER BY s.date ASC
      LIMIT ?
      `
      )
      .all(limit);

    return (rows as any[]).map(mapSessionRow);
  },

  findRecentUsed(limit = 8): SessionResult[] {
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
      WHERE s.used = 1
      ORDER BY datetime(COALESCE(s.usedAt, s.date)) DESC
      LIMIT ?
      `
      )
      .all(limit);

    return (rows as any[]).map(mapSessionRow);
  },

  findAll(start: string | Date, end: string | Date): SessionResult[] {
    const startIso =
      start instanceof Date ? start.toISOString() : String(start);
    const endIso = end instanceof Date ? end.toISOString() : String(end);

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
      WHERE datetime(s.date) BETWEEN datetime(?) AND datetime(?)
      ORDER BY s.date ASC
      `
      )
      .all(startIso, endIso);

    return (rows as any[]).map(mapSessionRow);
  },
};
