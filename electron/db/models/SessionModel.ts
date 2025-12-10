import { db } from "../";
import {
  SessionCreateInput,
  SessionUpdateInput,
  SessionResult,
} from "../types";

// Helper: map DB row → SessionResult
function mapSession(row: any): SessionResult {
  return {
    id: row.id,
    courseId: row.courseId,
    date: row.date,
    used: row.used,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const SessionModel = {
  // -------------------------
  // CREATE
  // -------------------------
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

  // -------------------------
  // FIND BY ID
  // -------------------------
  findById(id: number): SessionResult | null {
    const row = db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(id);
    return row ? mapSession(row) : null;
  },

  // -------------------------
  // FIND BY COURSE
  // -------------------------
  findByCourse(courseId: number): SessionResult[] {
    const rows = db
      .prepare(`SELECT * FROM Sessions WHERE courseId = ? ORDER BY date ASC`)
      .all(courseId);

    return rows.map(mapSession);
  },

  // -------------------------
  // FIND BY USER  (JOIN)
  // Sessions JOIN Courses
  // -------------------------
  findByUser(userId: number): SessionResult[] {
    const rows = db
      .prepare(
        `
        SELECT s.*
        FROM Sessions s
        JOIN Courses c ON s.courseId = c.id
        WHERE c.userId = ?
        ORDER BY s.date ASC
      `
      )
      .all(userId);

    return rows.map(mapSession);
  },

  // -------------------------
  // FIND UNUSED
  // -------------------------
  findUnused(): SessionResult[] {
    const rows = db
      .prepare(`SELECT * FROM Sessions WHERE used = 0 ORDER BY date ASC`)
      .all();

    return rows.map(mapSession);
  },

  // -------------------------
  // FIND UNUSED BY USER
  // -------------------------
  findUnusedByUser(userId: number): SessionResult[] {
    const rows = db
      .prepare(
        `
        SELECT s.*
        FROM Sessions s
        JOIN Courses c ON s.courseId = c.id
        WHERE s.used = 0 AND c.userId = ?
        ORDER BY s.date ASC
      `
      )
      .all(userId);

    return rows.map(mapSession);
  },

  // -------------------------
  // MARK AS USED
  // -------------------------
  markUsed(id: number): SessionResult | null {
    const session = this.findById(id);
    if (!session) return null;

    db.prepare(
      `
      UPDATE Sessions
      SET used = 1,
          usedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(id);

    return this.findById(id);
  },

  // -------------------------
  // UPDATE PARTIAL
  // -------------------------
  update(id: number, data: SessionUpdateInput): SessionResult | null {
    const exists = this.findById(id);
    if (!exists) return null;

    const existing = this.findById(id)!;

    const merged = {
      courseId: data.courseId ?? existing.courseId,
      date: data.date ?? existing.date,
      used: data.used ?? existing.used,
      usedAt: data.usedAt ?? existing.usedAt,
    };

    db.prepare(
      `
      UPDATE Sessions
      SET courseId = ?, date = ?, used = ?, usedAt = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(merged.courseId, merged.date, merged.used, merged.usedAt, id);

    return this.findById(id);
  },

  // -------------------------
  // DELETE
  // -------------------------
  delete(id: number) {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  // -------------------------
  // ALL
  // -------------------------
  all(): SessionResult[] {
    const rows = db.prepare(`SELECT * FROM Sessions ORDER BY date ASC`).all();

    return rows.map(mapSession);
  },
};
