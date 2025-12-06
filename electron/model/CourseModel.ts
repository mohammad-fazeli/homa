import { db } from "./db";

export type Course = {
  id: number;
  userId: number;
  cost: number;
  sessions: number;
};

export const CourseModel = {
  create(course: Omit<Course, "id">): Course {
    const stmt = db.prepare(`
      INSERT INTO Courses (userId, cost, sessions)
      VALUES (@userId, @cost, @sessions)
    `);

    const result = stmt.run(course);

    return db
      .prepare(`SELECT * FROM Courses WHERE id = ?`)
      .get(result.lastInsertRowid) as Course;
  },
};
