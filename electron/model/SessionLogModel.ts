import { db } from "./db";

export type SessionLog = {
  id?: number;
  userId: number;
  change: number;
  previousValue: number;
  newValue: number;
  description?: string;
};

export const SessionLogModel = {
  create(log: SessionLog) {
    const stmt = db.prepare(`
      INSERT INTO SessionLogs (userId, change, previousValue, newValue, description)
      VALUES (@userId, @change, @previousValue, @newValue, @description)
    `);
    stmt.run(log);
  },

  findByUser(userId: number) {
    return db
      .prepare(
        `
      SELECT * FROM SessionLogs
      WHERE userId = ?
      ORDER BY createdAt DESC
    `
      )
      .all(userId);
  },
};
