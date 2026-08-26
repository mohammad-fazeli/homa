import { ipcMain } from "electron";
import { db } from "../db";
import { PaymentModel } from "../db/models/PaymentModel";
import type {
  BillingLogItem,
  BillingSummary,
  PaymentCreateInput,
  RevenueByMonthItem,
  SessionStats,
} from "../db/types";

export function registerBillingHandlers() {
  ipcMain.handle("billing:getSummary", (): BillingSummary => {
    const totalUsers = (
      db.prepare(`SELECT COUNT(*) as count FROM Users`).get() as { count: number }
    ).count;

    const courseStats = db
      .prepare(
        `
        SELECT
          COUNT(*) as totalCourses,
          COALESCE(SUM(cost), 0) as totalRevenue,
          COALESCE(AVG(cost), 0) as avgCoursePrice
        FROM Courses
      `
      )
      .get() as {
      totalCourses: number;
      totalRevenue: number;
      avgCoursePrice: number;
    };

    const totalCollected = (
      db
        .prepare(`SELECT COALESCE(SUM(amount), 0) AS sum FROM Payments`)
        .get() as { sum: number }
    ).sum;

    return {
      totalUsers,
      totalCourses: courseStats.totalCourses,
      totalRevenue: courseStats.totalRevenue,
      totalCollected,
      totalOutstanding: Math.max(0, courseStats.totalRevenue - totalCollected),
      avgCoursePrice: Math.round(courseStats.avgCoursePrice),
    };
  });

  ipcMain.handle(
    "billing:getRevenueByMonth",
    (): RevenueByMonthItem[] => {
      const contracted = db
        .prepare(
          `
          SELECT strftime('%Y-%m', createdAt) as month, SUM(cost) as revenue
          FROM Courses
          GROUP BY month
        `
        )
        .all() as Array<{ month: string; revenue: number }>;
      const collected = db
        .prepare(
          `
          SELECT strftime('%Y-%m', paidAt) as month, SUM(amount) as collected
          FROM Payments
          GROUP BY month
        `
        )
        .all() as Array<{ month: string; collected: number }>;
      const months = new Set([
        ...contracted.map((row) => row.month),
        ...collected.map((row) => row.month),
      ]);
      return [...months]
        .filter(Boolean)
        .sort()
        .map((month) => ({
          month,
          revenue: contracted.find((row) => row.month === month)?.revenue ?? 0,
          collected:
            collected.find((row) => row.month === month)?.collected ?? 0,
        }));
    }
  );

  ipcMain.handle("billing:getSessionStats", (): SessionStats => {
    const used = (
      db
        .prepare(`SELECT COUNT(*) as count FROM Sessions WHERE used = 1`)
        .get() as { count: number }
    ).count;
    const remaining = (
      db
        .prepare(
          `SELECT COUNT(*) as count FROM Sessions WHERE used = 0 AND IFNULL(status, 'scheduled') != 'cancelled'`
        )
        .get() as { count: number }
    ).count;
    const absent = (
      db
        .prepare(`SELECT COUNT(*) as count FROM Sessions WHERE status = 'absent'`)
        .get() as { count: number }
    ).count;
    const cancelled = (
      db
        .prepare(
          `SELECT COUNT(*) as count FROM Sessions WHERE status = 'cancelled'`
        )
        .get() as { count: number }
    ).count;
    return { used, remaining, absent, cancelled };
  });

  ipcMain.handle(
    "billing:getRecentLogs",
    (_event, limit = 10): BillingLogItem[] => {
      const rows = db
        .prepare(
          `
          SELECT sl.id, sl.change, sl.description, sl.createdAt, u.firstName, u.lastName
          FROM SessionLogs sl
          JOIN Users u ON sl.userId = u.id
          ORDER BY sl.createdAt DESC
          LIMIT ?
        `
        )
        .all(Math.min(500, Math.max(1, Number(limit) || 10)));
      return rows.map((r: any) => ({
        id: r.id,
        userFullName: `${r.firstName} ${r.lastName}`,
        change: r.change,
        description: r.description,
        date: r.createdAt,
      }));
    }
  );

  ipcMain.handle("billing:listPayments", (_event, limit = 80, userId?: number) =>
    PaymentModel.list(limit, userId)
  );

  ipcMain.handle("billing:createPayment", (_event, data: PaymentCreateInput) =>
    PaymentModel.create(data)
  );

  ipcMain.handle("billing:deletePayment", (_event, id: number) =>
    PaymentModel.delete(id)
  );
}
