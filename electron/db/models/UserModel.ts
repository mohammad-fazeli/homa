import { db } from "../connection";
import {
  UserCreateInput,
  UserUpdateInput,
  UserFindAllItem,
  UserFindAllResult,
  UserFindByIdResult,
  UserCourseSummary,
  UserCourseDetail,
} from "../types";
import { mapSqliteError } from "../../lib/utils";

function mapSessions(sessions: any[]) {
  return sessions.map((s: any) => ({
    id: s.id,
    date: s.date,
    used: s.used as 0 | 1,
    usedAt: s.usedAt,
  }));
}

function mapCourseDetail(course: any, sessions: any[]): UserCourseDetail {
  return {
    id: course.id,
    cost: course.cost,
    totalSessions: course.sessions,
    createdAt: course.createdAt,
    sessions: mapSessions(sessions),
  };
}

function loadCourses(userId: number): UserCourseDetail[] {
  const courses = db
    .prepare(`SELECT * FROM Courses WHERE userId = ? ORDER BY id DESC`)
    .all(userId) as any[];

  return courses.map((course) => {
    const sessions = db
      .prepare(`SELECT * FROM Sessions WHERE courseId = ? ORDER BY date ASC`)
      .all(course.id);
    return mapCourseDetail(course, sessions);
  });
}

function mapUser(user: any): UserFindByIdResult {
  const courses = loadCourses(user.id);
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    nationalId: user.nationalId,
    uidCart: user.uidCart,
    course: courses[0] ?? null,
    courses,
  };
}

export const UserModel = {
  findAll(page = 1, limit = 15, search = ""): UserFindAllResult {
    const offset = (page - 1) * limit;
    const searchQuery = search.trim() ? `%${search.trim()}%` : null;

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
          ) as { count: number }
        ).count
      : (totalStmt.get() as { count: number }).count;

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

    const data: UserFindAllItem[] = (users as any[]).map((u) => {
      const stats: any = db
        .prepare(
          `
          SELECT
            COALESCE(SUM(sessions), 0) as totalSessions,
            MAX(id) as latestCourseId
          FROM Courses
          WHERE userId = ?
        `
        )
        .get(u.id);

      const latest: any = stats?.latestCourseId
        ? db
            .prepare(`SELECT id, userId, cost, sessions FROM Courses WHERE id = ?`)
            .get(stats.latestCourseId)
        : null;

      const nextSession: any = db
        .prepare(
          `
          SELECT s.date
          FROM Sessions s
          JOIN Courses c ON s.courseId = c.id
          WHERE c.userId = ?
            AND s.used = 0
            AND datetime(s.date) >= datetime('now')
          ORDER BY s.date ASC
          LIMIT 1
        `
        )
        .get(u.id);

      const courseSummary: UserCourseSummary = {
        id: latest?.id ?? 0,
        userId: u.id,
        cost: latest?.cost ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
        nextSessionDate: nextSession?.date ?? null,
      };

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
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    };
  },

  findById(id: number): UserFindByIdResult | null {
    const user: any = db.prepare(`SELECT * FROM Users WHERE id = ?`).get(id);
    return user ? mapUser(user) : null;
  },

  findByUidCart(uidCart: string): UserFindByIdResult | null {
    const user: any = db
      .prepare(`SELECT * FROM Users WHERE uidCart = ?`)
      .get(uidCart);
    return user ? mapUser(user) : null;
  },

  create(data: UserCreateInput) {
    try {
      const stmt = db.prepare(`
        INSERT INTO Users (firstName, lastName, phone, nationalId, uidCart)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.firstName,
        data.lastName,
        data.phone,
        data.nationalId,
        data.uidCart || null
      );

      return this.findById(result.lastInsertRowid as number);
    } catch (err) {
      mapSqliteError(err);
    }
  },

  update(data: UserUpdateInput) {
    const user = this.findById(data.id);
    if (!user) return null;

    try {
      db.prepare(
        `
        UPDATE Users
        SET firstName = ?, lastName = ?, phone = ?, nationalId = ?, uidCart = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(
        data.firstName,
        data.lastName,
        data.phone,
        data.nationalId,
        data.uidCart || null,
        data.id
      );
    } catch (err) {
      mapSqliteError(err);
    }

    return this.findById(data.id);
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM Users WHERE id = ?`).run(id).changes;
  },
};
