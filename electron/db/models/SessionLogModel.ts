import { db } from "../";

export const SessionLogModel = {
  create(data: {
    userId: number;
    change: number;
    previousValue: number;
    newValue: number;
    description: string;
  }) {
    db.prepare(
      `
      INSERT INTO SessionLogs (userId, change, previousValue, newValue, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    ).run(
      data.userId,
      data.change,
      data.previousValue,
      data.newValue,
      data.description
    );
  },
};
