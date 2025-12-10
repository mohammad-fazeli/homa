import { db } from "../";
import {
  UserCreateInput,
  UserUpdateInput,
  UserFindAllItem,
  UserFindAllResult,
  UserFindByIdResult,
  UserCourseSummary,
} from "../types";

/**
 * تبدیل نتیجه DB به User مدل
 */
function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    nationalId: row.nationalId,
  };
}

export const UserModel = {
  findAll(page = 1, limit = 15, search = ""): UserFindAllResult {
    const offset = (page - 1) * limit;
    const searchQuery = search.trim() ? `%${search.trim()}%` : null;

    // ============================
    // Count Users
    // ============================
    const totalStmt = searchQuery
      ? db.prepare(`
        SELECT COUNT(*) AS count
        FROM Users
        WHERE firstName LIKE ? OR lastName LIKE ? OR phone LIKE ? OR nationalId LIKE ?
      `)
      : db.prepare(`SELECT COUNT(*) AS count FROM Users`);

    const total = searchQuery
      ? (
          totalStmt.get(
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery
          ) as any
        ).count
      : (totalStmt.get() as any).count;

    // ============================
    // Fetch Users
    // ============================
    const usersStmt = searchQuery
      ? db.prepare(`
        SELECT *
        FROM Users
        WHERE firstName LIKE ? OR lastName LIKE ? OR phone LIKE ? OR nationalId LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      : db.prepare(`
        SELECT *
        FROM Users
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `);

    const users = searchQuery
      ? usersStmt.all(
          searchQuery,
          searchQuery,
          searchQuery,
          searchQuery,
          limit,
          offset
        )
      : usersStmt.all(limit, offset);

    // ============================
    // Build Result
    // ============================
    const data: UserFindAllItem[] = users.map((u: any) => {
      // آخرین دوره کاربر
      const course: any = db
        .prepare(
          `
        SELECT id, userId, cost, sessions
        FROM Courses
        WHERE userId = ?
        ORDER BY id DESC
        LIMIT 1
      `
        )
        .get(u.id);

      let courseSummary: UserCourseSummary = {
        id: 0,
        userId: u.id,
        cost: 0,
        totalSessions: 0,
        nextSessionDate: null,
      };

      if (course) {
        // تاریخ اولین جلسه آتی
        const nextSession: any = db
          .prepare(
            `
          SELECT date
          FROM Sessions
          WHERE courseId = ?
          ORDER BY date ASC
          LIMIT 1
        `
          )
          .get(course.id);

        courseSummary = {
          id: course.id,
          userId: course.userId,
          cost: course.cost,
          totalSessions: course.sessions,
          nextSessionDate: nextSession?.date ?? null,
        };
      }

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        nationalId: u.nationalId,
        course: courseSummary,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
  // ================================
  // FIND BY ID (with course + sessions)
  // ================================
  findById(id: number): UserFindByIdResult | null {
    const user: any = db.prepare(`SELECT * FROM Users WHERE id = ?`).get(id);
    if (!user) return null;

    const course: any = db
      .prepare(
        `
        SELECT * FROM Courses
        WHERE userId = ?
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get(id);

    if (!course) {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalId: user.nationalId,
        course: null,
      };
    }

    const sessions = db
      .prepare(
        `
        SELECT * FROM Sessions
        WHERE courseId = ?
        ORDER BY date ASC
      `
      )
      .all(course.id);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      nationalId: user.nationalId,
      course: {
        id: course.id,
        cost: course.cost,
        totalSessions: course.sessions,
        sessions: sessions.map((s: any) => ({
          id: s.id,
          date: s.date,
          used: !!s.used,
          usedAt: s.usedAt,
        })),
      },
    };
  },

  // ================================
  // CREATE USER
  // ================================
  create(data: UserCreateInput) {
    const stmt = db.prepare(`
      INSERT INTO Users (firstName, lastName, phone, nationalId)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.firstName,
      data.lastName,
      data.phone,
      data.nationalId
    );

    return this.findById(result.lastInsertRowid as number);
  },

  // ================================
  // UPDATE USER
  // ================================
  update(data: UserUpdateInput) {
    const user = this.findById(data.id);
    if (!user) return null;

    db.prepare(
      `
    UPDATE Users
    SET firstName = ?, lastName = ?, phone = ?, nationalId = ?
    WHERE id = ?
  `
    ).run(data.firstName, data.lastName, data.phone, data.nationalId, data.id);

    return this.findById(data.id);
  },

  // ================================
  // DELETE USER
  // ================================
  delete(id: number) {
    return db.prepare(`DELETE FROM Users WHERE id = ?`).run(id).changes;
  },
};
