import { db } from "../connection";
import { CourseCreateInput, CourseResult } from "../types";

function mapCourse(row: any): CourseResult {
  return {
    id: row.id,
    userId: row.userId,
    cost: row.cost,
    sessions: row.sessions,
    title: row.title ?? "دوره",
    roomId: row.roomId ?? null,
    instructorId: row.instructorId ?? null,
    templateId: row.templateId ?? null,
    expiresAt: row.expiresAt ?? null,
    notes: row.notes ?? null,
    groupId: row.groupId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const CourseModel = {
  create(data: CourseCreateInput): CourseResult {
    const stmt = db.prepare(`
      INSERT INTO Courses (
        userId, cost, sessions, title, roomId, instructorId, templateId,
        expiresAt, notes, groupId, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      data.userId,
      data.cost,
      data.sessions ?? 0,
      data.title?.trim() || "دوره",
      data.roomId ?? null,
      data.instructorId ?? null,
      data.templateId ?? null,
      data.expiresAt ?? null,
      data.notes ?? null,
      data.groupId ?? null
    );

    return this.findById(result.lastInsertRowid as number)!;
  },

  findById(id: number): CourseResult | null {
    const row = db.prepare(`SELECT * FROM Courses WHERE id = ?`).get(id);
    return row ? mapCourse(row) : null;
  },

  findByUserId(userId: number): CourseResult[] {
    const rows = db
      .prepare(`SELECT * FROM Courses WHERE userId = ? ORDER BY id DESC`)
      .all(userId);

    return rows.map(mapCourse);
  },

  update(data: {
    id: number;
    cost: number;
    sessions: number;
    title?: string | null;
    roomId?: number | null;
    instructorId?: number | null;
    templateId?: number | null;
    expiresAt?: string | Date | null;
    notes?: string | null;
    groupId?: number | null;
  }) {
    const course = this.findById(data.id);
    if (!course) return null;

    db.prepare(
      `
      UPDATE Courses
      SET cost = ?, sessions = ?, title = ?, roomId = ?, instructorId = ?,
          templateId = ?, expiresAt = ?, notes = ?, groupId = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(
      data.cost,
      data.sessions,
      data.title?.trim() || course.title || "دوره",
      data.roomId === undefined ? course.roomId ?? null : data.roomId,
      data.instructorId === undefined
        ? course.instructorId ?? null
        : data.instructorId,
      data.templateId === undefined ? course.templateId ?? null : data.templateId,
      data.expiresAt === undefined ? course.expiresAt ?? null : data.expiresAt,
      data.notes === undefined ? course.notes ?? null : data.notes,
      data.groupId === undefined ? course.groupId ?? null : data.groupId,
      data.id
    );

    return this.findById(data.id);
  },

  findByUserAndGroup(userId: number, groupId: number): CourseResult | null {
    const row = db
      .prepare(
        `SELECT * FROM Courses WHERE userId = ? AND groupId = ? ORDER BY id DESC LIMIT 1`
      )
      .get(userId, groupId);
    return row ? mapCourse(row) : null;
  },

  delete(id: number) {
    db.prepare(`UPDATE Payments SET courseId = NULL WHERE courseId = ?`).run(id);
    db.prepare(
      `UPDATE ClassGroupMembers SET courseId = NULL WHERE courseId = ?`
    ).run(id);
    return db.prepare(`DELETE FROM Courses WHERE id = ?`).run(id).changes;
  },
};
