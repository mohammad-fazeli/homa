import { db } from "../";
import { CourseCreateInput, CourseResult, CourseUpdateInput } from "../types";

function mapCourse(row: any): CourseResult {
  return {
    id: row.id,
    userId: row.userId,
    cost: row.cost,
    sessions: row.sessions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const CourseModel = {
  create(data: CourseCreateInput): CourseResult {
    const stmt = db.prepare(`
      INSERT INTO Courses (userId, cost, sessions, createdAt, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(data.userId, data.cost, data.sessions ?? 0);

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

  update(data: { cost: number; sessions: number; id: number }) {
    const course = this.findById(data.id);
    if (!course) return null;

    db.prepare(
      `
    UPDATE Courses
    SET cost = ?, sessions = ?
    WHERE id = ?
  `
    ).run(data.cost, data.sessions, data.id);

    return this.findById(data.id);
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM Courses WHERE id = ?`).run(id).changes;
  },
};
