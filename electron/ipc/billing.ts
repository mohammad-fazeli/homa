import { ipcMain } from "electron";
import { db } from "../db";
import {
  BillingSummary,
  RevenueByMonthItem,
  SessionStats,
  BillingLogItem,
} from "../db/types";

export function registerBillingHandlers() {
  // ===============================
  // SUMMARY
  // ===============================
  ipcMain.handle("billing:getSummary", async (): Promise<BillingSummary> => {
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

    return {
      totalUsers,
      totalCourses: courseStats.totalCourses,
      totalRevenue: courseStats.totalRevenue,
      avgCoursePrice: Math.round(courseStats.avgCoursePrice),
    };
  });

  // ===============================
  // REVENUE BY MONTH
  // ===============================
  ipcMain.handle(
    "billing:getRevenueByMonth",
    async (): Promise<RevenueByMonthItem[]> => {
      const rows = db
        .prepare(
          `
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          SUM(cost) as revenue
        FROM Courses
        GROUP BY month
        ORDER BY month ASC
      `
        )
        .all();

      return rows.map((r: any) => ({
        month: r.month,
        revenue: r.revenue,
      }));
    }
  );

  // ===============================
  // SESSION STATS
  // ===============================
  ipcMain.handle("billing:getSessionStats", async (): Promise<SessionStats> => {
    const used = (
      db
        .prepare(`SELECT COUNT(*) as count FROM Sessions WHERE used = 1`)
        .get() as { count: number }
    ).count;

    const remaining = (
      db
        .prepare(`SELECT COUNT(*) as count FROM Sessions WHERE used = 0`)
        .get() as { count: number }
    ).count;

    return { used, remaining };
  });

  // ===============================
  // RECENT FINANCIAL LOGS
  // ===============================
  ipcMain.handle(
    "billing:getRecentLogs",
    async (_event, limit = 10): Promise<BillingLogItem[]> => {
      const rows = db
        .prepare(
          `
        SELECT 
          sl.id,
          sl.change,
          sl.description,
          sl.createdAt,
          u.firstName,
          u.lastName
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
}
