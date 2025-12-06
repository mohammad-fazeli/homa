import { db } from "./db";

export type Session = {
  id: number;
  courseId: number;
  date: Date;
};

export const SessionModel = {
  create(session: Omit<Session, "id">): Session {
    const stmt = db.prepare(`
      INSERT INTO Sessions (courseId, date)
      VALUES (@courseId, @date)
    `);

    const result = stmt.run(session);

    return db
      .prepare(`SELECT * FROM Sessions WHERE id = ?`)
      .get(result.lastInsertRowid) as Session;
  },
};
