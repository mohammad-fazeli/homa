import { db } from "./db";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
};

export const UserModel = {
  findAll(page = 1, limit = 15, search = "") {
    const offset = (page - 1) * limit;

    // --- Search Conditions ---
    let whereClause = "";
    let params = [];

    if (search && search.trim() !== "") {
      whereClause = `
      WHERE 
        Users.firstName LIKE ? 
        OR Users.lastName LIKE ?
        OR Users.phone LIKE ?
        OR Users.nationalId LIKE ?
    `;
      const likeValue = `%${search}%`;
      params.push(likeValue, likeValue, likeValue, likeValue);
    }

    // --- Total Count ---
    const totalQuery = `
    SELECT COUNT(*) AS count
    FROM Users
    ${whereClause}
  `;
    const total = (db.prepare(totalQuery).get(...params) as any).count;

    // --- Main Query (with LAST course + nextSessionDate) ---
    const usersQuery = `
    SELECT
      Users.id AS userId,
      Users.firstName,
      Users.lastName,
      Users.phone,
      Users.nationalId,

      c.id AS courseId,
      c.userId AS courseUserId,
      c.cost AS courseCost,
      c.sessions AS courseSessions,

      (
        SELECT date
        FROM Sessions
        WHERE courseId = c.id
        ORDER BY date ASC
        LIMIT 1
      ) AS nextSessionDate

    FROM Users

    LEFT JOIN Courses c ON c.id = (
      SELECT id 
      FROM Courses 
      WHERE userId = Users.id
      ORDER BY id DESC
      LIMIT 1
    )

    ${whereClause}

    ORDER BY Users.id DESC
    LIMIT ? OFFSET ?
  `;

    const users: any[] = db.prepare(usersQuery).all(...params, limit, offset);

    // --- Format Output ---
    const formattedUsers = users.map((u) => ({
      id: u.userId,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      nationalId: u.nationalId,
      course: u.courseId
        ? {
            id: u.courseId,
            userId: u.courseUserId,
            cost: u.courseCost,
            totalSessions: u.courseSessions,
            nextSessionDate: u.nextSessionDate || null,
          }
        : null,
    }));

    return {
      data: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findById(userId: number) {
    // --- دریافت اطلاعات کاربر ---
    const user: any = db
      .prepare(
        `
    SELECT *
    FROM Users
    WHERE id = ?
  `
      )
      .get(userId);

    if (!user) return null;

    // --- دریافت آخرین دوره ---
    const course: any = db
      .prepare(
        `
    SELECT *
    FROM Courses
    WHERE userId = ?
    ORDER BY id DESC
    LIMIT 1
  `
      )
      .get(userId);

    // اگر کاربر دوره‌ای ندارد
    if (!course) {
      return {
        ...user,
        course: null,
        sessions: [],
      };
    }

    // --- دریافت تمام جلسات ---
    const sessions: any[] = db
      .prepare(
        `
    SELECT 
      id,
      courseId,
      date,
      used,
      usedAt
    FROM Sessions
    WHERE courseId = ?
    ORDER BY date ASC
  `
      )
      .all(course.id);

    // ساخت خروجی نهایی
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
        sessions: sessions.map((s) => ({
          id: s.id,
          date: s.date,
          used: !!s.used,
          usedAt: s.usedAt,
        })),
      },
    };
  },

  create(user: Omit<User, "id">): User {
    const stmt = db.prepare(`
    INSERT INTO Users (firstName, lastName, phone, nationalId)
    VALUES (@firstName, @lastName, @phone, @nationalId)
  `);

    const result = stmt.run(user);

    return db
      .prepare(`SELECT * FROM Users WHERE id = ?`)
      .get(result.lastInsertRowid) as User;
  },

  update(user: User) {
    const stmt = db.prepare(`
      UPDATE Users
      SET firstName=@firstName, lastName=@lastName, phone=@phone,
          nationalId=@nationalId
      WHERE id=@id
    `);
    stmt.run(user);
  },

  delete(id: number) {
    db.prepare("DELETE FROM Users WHERE id = ?").run(id);
  },
};
