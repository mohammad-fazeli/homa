import { db } from "../";
import {
  UserCreateInput,
  UserUpdateInput,
  UserFindAllItem,
  UserFindAllResult,
  UserFindByIdResult,
  UserCourseSummary,
} from "../types";
import { mapSqliteError } from "../../lib/utils";

function mapUserWithCourse(user: any, course: any, sessions: any[]) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    nationalId: user.nationalId,
    uidCart: user.uidCart,
    course: course
      ? {
          id: course.id,
          cost: course.cost,
          totalSessions: course.sessions,
          sessions: sessions.map((s: any) => ({
            id: s.id,
            date: s.date,
            used: s.used,
            usedAt: s.usedAt,
          })),
        }
      : null,
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
        const nextSession: any = db
          .prepare(
            `
          SELECT date
          FROM Sessions
          WHERE courseId = ?
            AND used = 0
            AND datetime(date) >= datetime('now')
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
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    };
  },

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
      return mapUserWithCourse(user, null, []);
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

    return mapUserWithCourse(user, course, sessions);
  },

  findByUidCart(uidCart: string): UserFindByIdResult | null {
    const user: any = db
      .prepare(`SELECT * FROM Users WHERE uidCart = ?`)
      .get(uidCart);
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
      .get(user.id);

    if (!course) {
      return mapUserWithCourse(user, null, []);
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

    return mapUserWithCourse(user, course, sessions);
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
