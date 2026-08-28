import { db } from "../connection";
import {
  UserCreateInput,
  UserUpdateInput,
  UserFindAllItem,
  UserFindAllResult,
  UserFindByIdResult,
  UserCourseSummary,
  UserCourseDetail,
  UserListFilter,
  UserFilterCounts,
  UserCourseSessionItem,
} from "../types";
import { addDays, mapSqliteError, startOfDay } from "../../lib/utils";
import { normalizeStatus } from "../../../shared/session";
import { appliedSql, settleAccount } from "../../../shared/finance";
import { PaymentModel } from "./PaymentModel";
import { photoUrlFor, removePhotoFile } from "../../lib/photo-files";

function todayRange() {
  const start = startOfDay();
  return { start: start.toISOString(), end: addDays(start, 1).toISOString() };
}

function remainingSql(userAlias: string) {
  return `
    COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = ${userAlias}.id), 0)
    - COALESCE((
      SELECT COUNT(*) FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      WHERE c.userId = ${userAlias}.id AND s.used = 1
    ), 0)
  `;
}

function debtSql(userAlias: string) {
  return `
    COALESCE((SELECT SUM(cost) FROM Courses WHERE userId = ${userAlias}.id), 0)
    - COALESCE((SELECT SUM(${appliedSql()}) FROM Payments WHERE userId = ${userAlias}.id), 0)
  `;
}

function expiredSql(userAlias: string) {
  return `
    EXISTS (
      SELECT 1 FROM Courses c
      WHERE c.userId = ${userAlias}.id
        AND c.expiresAt IS NOT NULL AND TRIM(c.expiresAt) != ''
        AND datetime(c.expiresAt) < datetime('now')
        AND (
          c.sessions - COALESCE((
            SELECT COUNT(*) FROM Sessions s WHERE s.courseId = c.id AND s.used = 1
          ), 0)
        ) > 0
    )
  `;
}

function listWhere(search: string, filter: UserListFilter) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  const term = search.trim();

  if (term) {
    const like = `%${term}%`;
    clauses.push(
      `(firstName LIKE ? OR lastName LIKE ? OR (firstName || ' ' || lastName) LIKE ? OR phone LIKE ? OR nationalId LIKE ? OR IFNULL(uidCart, '') LIKE ?)`
    );
    params.push(like, like, like, like, like, like);
  }

  if (filter === "no_card") {
    clauses.push(`(uidCart IS NULL OR TRIM(uidCart) = '')`);
  } else if (filter === "today") {
    const { start, end } = todayRange();
    clauses.push(`EXISTS (
      SELECT 1 FROM Sessions s
      JOIN Courses c ON s.courseId = c.id
      WHERE c.userId = Users.id
        AND datetime(s.date) >= datetime(?)
        AND datetime(s.date) < datetime(?)
        AND IFNULL(s.status, 'scheduled') != 'cancelled'
    )`);
    params.push(start, end);
  } else if (filter === "low_credit") {
    clauses.push(`
      COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = Users.id), 0) > 0
      AND (${remainingSql("Users")}) <= 2
    `);
  } else if (filter === "expired") {
    clauses.push(expiredSql("Users"));
  } else if (filter === "debt") {
    clauses.push(`(${debtSql("Users")}) > 0`);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function mapSessions(sessions: any[]): UserCourseSessionItem[] {
  return sessions.map((s: any) => ({
    id: s.id,
    date: s.date,
    used: s.used as 0 | 1,
    usedAt: s.usedAt,
    status: normalizeStatus(s.status, s.used),
    roomId: s.roomId ?? null,
    instructorId: s.instructorId ?? null,
  }));
}

function loadCourses(userId: number): UserCourseDetail[] {
  const courses = db
    .prepare(
      `
      SELECT
        c.*,
        r.name AS roomName,
        r.color AS roomColor,
        CASE
          WHEN i.id IS NULL THEN NULL
          ELSE i.firstName || ' ' || i.lastName
        END AS instructorName,
        g.name AS groupName
      FROM Courses c
      LEFT JOIN Rooms r ON r.id = c.roomId
      LEFT JOIN Instructors i ON i.id = c.instructorId
      LEFT JOIN ClassGroups g ON g.id = c.groupId
      WHERE c.userId = ?
      ORDER BY c.id DESC
    `
    )
    .all(userId) as any[];

  return courses.map((course) => {
    const sessions = db
      .prepare(`SELECT * FROM Sessions WHERE courseId = ? ORDER BY date ASC`)
      .all(course.id);
    const paidAmount = PaymentModel.sumByCourse(course.id);
    return {
      id: course.id,
      cost: course.cost,
      totalSessions: course.sessions,
      title: course.title || "دوره",
      roomId: course.roomId ?? null,
      instructorId: course.instructorId ?? null,
      templateId: course.templateId ?? null,
      expiresAt: course.expiresAt ?? null,
      notes: course.notes ?? null,
      groupId: course.groupId ?? null,
      groupName: course.groupName ?? null,
      roomName: course.roomName ?? null,
      roomColor: course.roomColor ?? null,
      instructorName: course.instructorName ?? null,
      paidAmount,
      debt: Math.max(0, course.cost - paidAmount),
      createdAt: course.createdAt,
      sessions: mapSessions(sessions),
    };
  });
}

function mapUser(user: any): UserFindByIdResult {
  const courses = loadCourses(user.id);
  const contracted = courses.reduce((sum, course) => sum + course.cost, 0);
  const paidAmount = PaymentModel.sumByUser(user.id);
  const { debt, credit } = settleAccount(contracted, paidAmount);
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    nationalId: user.nationalId,
    uidCart: user.uidCart,
    notes: user.notes ?? null,
    photoUrl: photoUrlFor("user", user.id),
    course: courses[0] ?? null,
    courses,
    debt,
    credit,
    contracted,
    paidAmount,
  };
}

export const UserModel = {
  filterCounts(): UserFilterCounts {
    const { start, end } = todayRange();
    const count = (sql: string, params: Array<string | number> = []) =>
      (db.prepare(sql).get(...params) as { count: number }).count;

    return {
      all: count(`SELECT COUNT(*) AS count FROM Users`),
      no_card: count(`
        SELECT COUNT(*) AS count FROM Users
        WHERE uidCart IS NULL OR TRIM(uidCart) = ''
      `),
      today: count(
        `
        SELECT COUNT(DISTINCT u.id) AS count
        FROM Users u
        JOIN Courses c ON c.userId = u.id
        JOIN Sessions s ON s.courseId = c.id
        WHERE datetime(s.date) >= datetime(?) AND datetime(s.date) < datetime(?)
          AND IFNULL(s.status, 'scheduled') != 'cancelled'
        `,
        [start, end]
      ),
      low_credit: count(`
        SELECT COUNT(*) AS count FROM Users u
        WHERE COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = u.id), 0) > 0
          AND (${remainingSql("u")}) <= 2
      `),
      expired: count(`SELECT COUNT(*) AS count FROM Users u WHERE ${expiredSql("u")}`),
      debt: count(`SELECT COUNT(*) AS count FROM Users u WHERE (${debtSql("u")}) > 0`),
    };
  },

  findAll(
    page = 1,
    limit = 15,
    search = "",
    filter: UserListFilter = "all"
  ): UserFindAllResult {
    const offset = (page - 1) * limit;
    const where = listWhere(search, filter);

    const total = (
      db
        .prepare(`SELECT COUNT(*) AS count FROM Users ${where.sql}`)
        .get(...where.params) as { count: number }
    ).count;

    const users = db
      .prepare(
        `
        SELECT *
        FROM Users
        ${where.sql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(...where.params, limit, offset);

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
            .prepare(
              `
              SELECT c.id, c.userId, c.cost, c.sessions, c.title, r.name AS roomName
              FROM Courses c
              LEFT JOIN Rooms r ON r.id = c.roomId
              WHERE c.id = ?
            `
            )
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
            AND IFNULL(s.status, 'scheduled') != 'cancelled'
            AND datetime(s.date) >= datetime('now')
          ORDER BY s.date ASC
          LIMIT 1
        `
        )
        .get(u.id);

      const usedSessions = (
        db
          .prepare(
            `
            SELECT COUNT(*) AS count
            FROM Sessions s
            JOIN Courses c ON s.courseId = c.id
            WHERE c.userId = ? AND s.used = 1
          `
          )
          .get(u.id) as { count: number }
      ).count;

      const totalSessions = stats?.totalSessions ?? 0;
      const paid = PaymentModel.sumByUser(u.id);
      const contracted = (
        db
          .prepare(
            `SELECT COALESCE(SUM(cost), 0) AS sum FROM Courses WHERE userId = ?`
          )
          .get(u.id) as { sum: number }
      ).sum;
      const expiredRow = db
        .prepare(`SELECT ${expiredSql("Users")} AS expired FROM Users WHERE id = ?`)
        .get(u.id) as { expired: number };

      const courseSummary: UserCourseSummary = {
        id: latest?.id ?? 0,
        userId: u.id,
        cost: latest?.cost ?? 0,
        totalSessions,
        nextSessionDate: nextSession?.date ?? null,
        title: latest?.title ?? null,
        roomName: latest?.roomName ?? null,
      };

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        nationalId: u.nationalId,
        course: courseSummary,
        usedSessions,
        remainingSessions: Math.max(0, totalSessions - usedSessions),
        hasCard: Boolean(u.uidCart),
        courseTitle: latest?.title || "—",
        roomName: latest?.roomName ?? null,
        debt: Math.max(0, contracted - paid),
        expired: Boolean(expiredRow?.expired),
        photoUrl: photoUrlFor("user", u.id),
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
        INSERT INTO Users (firstName, lastName, phone, nationalId, uidCart, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.firstName,
        data.lastName,
        data.phone,
        data.nationalId,
        data.uidCart || null,
        data.notes?.trim() || null
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
            notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(
        data.firstName,
        data.lastName,
        data.phone,
        data.nationalId,
        data.uidCart || null,
        data.notes?.trim() || null,
        data.id
      );
    } catch (err) {
      mapSqliteError(err);
    }

    return this.findById(data.id);
  },

  delete(id: number) {
    const changes = db.prepare(`DELETE FROM Users WHERE id = ?`).run(id).changes;
    if (changes) removePhotoFile("user", id);
    return changes;
  },
};
