import { db } from "../connection";
import {
  CourseTemplateAttributes,
  CourseTemplateWriteInput,
} from "../types";

function mapTemplate(row: any): CourseTemplateAttributes {
  return {
    id: row.id,
    name: row.name,
    sessions: row.sessions,
    cost: row.cost,
    durationMinutes: row.durationMinutes,
  };
}

export const CourseTemplateModel = {
  list(): CourseTemplateAttributes[] {
    return db
      .prepare(`SELECT * FROM CourseTemplates ORDER BY id ASC`)
      .all()
      .map(mapTemplate);
  },

  findById(id: number): CourseTemplateAttributes | null {
    const row = db.prepare(`SELECT * FROM CourseTemplates WHERE id = ?`).get(id);
    return row ? mapTemplate(row) : null;
  },

  save(data: CourseTemplateWriteInput): CourseTemplateAttributes {
    const name = data.name.trim();
    if (!name) throw new Error("نام بسته را وارد کنید");
    const sessions = Math.max(1, Math.floor(Number(data.sessions) || 1));
    const cost = Math.max(0, Math.floor(Number(data.cost) || 0));
    const durationMinutes = Math.max(
      15,
      Math.floor(Number(data.durationMinutes) || 60)
    );

    if (data.id && data.id > 0) {
      db.prepare(
        `
        UPDATE CourseTemplates
        SET name = ?, sessions = ?, cost = ?, durationMinutes = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(name, sessions, cost, durationMinutes, data.id);
      return this.findById(data.id)!;
    }

    const result = db
      .prepare(
        `
        INSERT INTO CourseTemplates (name, sessions, cost, durationMinutes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(name, sessions, cost, durationMinutes);
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number) {
    db.prepare(`UPDATE Courses SET templateId = NULL WHERE templateId = ?`).run(
      id
    );
    return db.prepare(`DELETE FROM CourseTemplates WHERE id = ?`).run(id).changes;
  },
};
