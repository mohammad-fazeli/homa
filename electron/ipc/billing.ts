import { ipcMain } from "electron";
import { db } from "../db";
import { PaymentModel } from "../db/models/PaymentModel";
import { addDays, startOfDay, startOfWeekSaturday } from "../lib/utils";
import { cashInSql, collectionRate, refundSql, settlementRate } from "../../shared/finance";
import type {
  BillingLogItem,
  BillingOverview,
  BillingSummary,
  PaymentCreateInput,
  PaymentListFilter,
  PaymentUpdateInput,
  RevenueByMonthItem,
  SessionStats,
} from "../db/types";

function sessionStats(): SessionStats {
  const used = (
    db.prepare(`SELECT COUNT(*) as count FROM Sessions WHERE used = 1`).get() as {
      count: number;
    }
  ).count;
  const remaining = (
    db
      .prepare(
        `SELECT COUNT(*) as count FROM Sessions WHERE used = 0 AND IFNULL(status, 'scheduled') != 'cancelled'`
      )
      .get() as { count: number }
  ).count;
  const absent = (
    db.prepare(`SELECT COUNT(*) as count FROM Sessions WHERE status = 'absent'`).get() as {
      count: number;
    }
  ).count;
  const cancelled = (
    db
      .prepare(`SELECT COUNT(*) as count FROM Sessions WHERE status = 'cancelled'`)
      .get() as { count: number }
  ).count;
  return { used, remaining, absent, cancelled };
}

function recentLogs(limit = 10): BillingLogItem[] {
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
  return rows.map((row: any) => ({
    id: row.id,
    userFullName: `${row.firstName} ${row.lastName}`,
    change: row.change,
    description: row.description,
    date: row.createdAt,
  }));
}

function revenueByMonth(): RevenueByMonthItem[] {
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
      SELECT strftime('%Y-%m', paidAt) as month,
        COALESCE(SUM(${cashInSql()}), 0) - COALESCE(SUM(${refundSql()}), 0) as collected
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
      collected: collected.find((row) => row.month === month)?.collected ?? 0,
    }));
}

function buildSummary(): BillingSummary {
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
    .get() as { totalCourses: number; totalRevenue: number; avgCoursePrice: number };

  const allTime = PaymentModel.listFiltered({ limit: 1 });
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeekSaturday(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const tomorrow = addDays(todayStart, 1);

  const today = PaymentModel.cashBetween(todayStart.toISOString(), tomorrow.toISOString());
  const week = PaymentModel.cashBetween(weekStart.toISOString(), tomorrow.toISOString());
  const month = PaymentModel.cashBetween(monthStart.toISOString(), tomorrow.toISOString());
  const debtors = PaymentModel.listDebtors();
  const outstanding = debtors.reduce((sum, row) => sum + row.debt, 0);
  const credit = debtors.reduce((sum, row) => sum + row.credit, 0);
  const applied = allTime.collected + allTime.discounted - allTime.refunded;

  return {
    totalUsers,
    totalCourses: courseStats.totalCourses,
    totalRevenue: courseStats.totalRevenue,
    totalCollected: allTime.collected,
    totalRefunded: allTime.refunded,
    totalDiscounted: allTime.discounted,
    netCash: allTime.net,
    totalOutstanding: outstanding,
    totalCredit: credit,
    avgCoursePrice: Math.round(courseStats.avgCoursePrice),
    debtorCount: debtors.filter((row) => row.debt > 0).length,
    creditorCount: debtors.filter((row) => row.credit > 0).length,
    collectionRate: collectionRate(allTime.collected, courseStats.totalRevenue),
    settlementRate: settlementRate(applied, courseStats.totalRevenue),
    todayCollected: today.collected,
    todayRefunded: today.refunded,
    todayNet: today.net,
    weekCollected: week.collected,
    monthCollected: month.collected,
    monthRefunded: month.refunded,
    monthNet: month.net,
  };
}

function overview(): BillingOverview {
  const summary = buildSummary();
  const debtors = PaymentModel.listDebtors().filter((row) => row.debt > 0);
  return {
    summary,
    byMethod: PaymentModel.methodBreakdown(),
    revenueByMonth: revenueByMonth(),
    sessionStats: sessionStats(),
    aging: PaymentModel.aging(),
    topDebtors: debtors.slice(0, 8),
    recentPayments: PaymentModel.listFiltered({ limit: 8 }).data,
    logs: recentLogs(8),
  };
}

export function registerBillingHandlers() {
  ipcMain.handle("billing:getSummary", () => buildSummary());
  ipcMain.handle("billing:getRevenueByMonth", () => revenueByMonth());
  ipcMain.handle("billing:getSessionStats", () => sessionStats());
  ipcMain.handle("billing:getRecentLogs", (_event, limit = 10) => recentLogs(limit));
  ipcMain.handle("billing:getOverview", () => overview());
  ipcMain.handle("billing:listDebtors", () => PaymentModel.listDebtors());
  ipcMain.handle("billing:getRangeReport", (_event, from: string, to: string) =>
    PaymentModel.rangeReport(from, to)
  );

  ipcMain.handle(
    "billing:listPayments",
    (_event, limitOrFilter: number | PaymentListFilter = 80, userId?: number) => {
      if (typeof limitOrFilter === "object" && limitOrFilter) {
        return PaymentModel.listFiltered(limitOrFilter);
      }
      return PaymentModel.listFiltered({
        limit: Number(limitOrFilter) || 80,
        userId,
      });
    }
  );

  ipcMain.handle("billing:createPayment", (_event, data: PaymentCreateInput) =>
    PaymentModel.create(data)
  );
  ipcMain.handle("billing:updatePayment", (_event, data: PaymentUpdateInput) =>
    PaymentModel.update(data)
  );
  ipcMain.handle("billing:deletePayment", (_event, id: number) =>
    PaymentModel.delete(id)
  );
}
