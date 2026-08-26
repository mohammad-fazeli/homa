import { db } from "../connection";
import { PaymentAttributes, PaymentCreateInput, PaymentMethod } from "../types";

const METHODS: PaymentMethod[] = ["cash", "card", "transfer"];

function mapPayment(row: any): PaymentAttributes {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId ?? null,
    amount: row.amount,
    method: (METHODS.includes(row.method) ? row.method : "cash") as PaymentMethod,
    note: row.note ?? null,
    paidAt: row.paidAt,
    userFullName: row.firstName
      ? `${row.firstName} ${row.lastName}`
      : undefined,
    courseTitle: row.courseTitle ?? null,
  };
}

export const PaymentModel = {
  list(limit = 50, userId?: number): PaymentAttributes[] {
    const cap = Math.min(500, Math.max(1, Number(limit) || 50));
    if (userId) {
      return db
        .prepare(
          `
          SELECT p.*, u.firstName, u.lastName, c.title AS courseTitle
          FROM Payments p
          JOIN Users u ON u.id = p.userId
          LEFT JOIN Courses c ON c.id = p.courseId
          WHERE p.userId = ?
          ORDER BY datetime(p.paidAt) DESC, p.id DESC
          LIMIT ?
        `
        )
        .all(userId, cap)
        .map(mapPayment);
    }
    return db
      .prepare(
        `
        SELECT p.*, u.firstName, u.lastName, c.title AS courseTitle
        FROM Payments p
        JOIN Users u ON u.id = p.userId
        LEFT JOIN Courses c ON c.id = p.courseId
        ORDER BY datetime(p.paidAt) DESC, p.id DESC
        LIMIT ?
      `
      )
      .all(cap)
      .map(mapPayment);
  },

  sumByCourse(courseId: number): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS sum FROM Payments WHERE courseId = ?`
      )
      .get(courseId) as { sum: number };
    return row.sum;
  },

  sumByUser(userId: number): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS sum FROM Payments WHERE userId = ?`
      )
      .get(userId) as { sum: number };
    return row.sum;
  },

  create(data: PaymentCreateInput): PaymentAttributes {
    const amount = Math.floor(Number(data.amount) || 0);
    if (amount === 0) throw new Error("مبلغ پرداخت نمی‌تواند صفر باشد");
    const method = METHODS.includes(data.method) ? data.method : "cash";
    const paidAt = data.paidAt || new Date().toISOString();
    const result = db
      .prepare(
        `
        INSERT INTO Payments (userId, courseId, amount, method, note, paidAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(
        data.userId,
        data.courseId ?? null,
        amount,
        method,
        data.note ?? null,
        paidAt
      );
    const row = db
      .prepare(
        `
        SELECT p.*, u.firstName, u.lastName, c.title AS courseTitle
        FROM Payments p
        JOIN Users u ON u.id = p.userId
        LEFT JOIN Courses c ON c.id = p.courseId
        WHERE p.id = ?
      `
      )
      .get(result.lastInsertRowid) as any;
    return mapPayment(row);
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM Payments WHERE id = ?`).run(id).changes;
  },
};
