import { ipcMain } from "electron";
import { DashboardStats } from "../db/types";
import { db } from "../db";
import { addDays, startOfWeekSaturday } from "../lib/utils";

export function registerDashboardHandlers() {
  ipcMain.handle("dashboard:getStats", (): DashboardStats => {
    const activeUsers = (
      db
        .prepare(
          `
          SELECT COUNT(DISTINCT u.id) AS count
          FROM Users u
          JOIN Courses c ON c.userId = u.id
        `
        )
        .get() as { count: number }
    ).count;

    const weekStart = startOfWeekSaturday();
    const weekEnd = addDays(weekStart, 7);

    const weeklySessions = (
      db
        .prepare(
          `
      SELECT COUNT(*) AS count
      FROM Sessions
      WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?)
    `
        )
        .get(weekStart.toISOString(), weekEnd.toISOString()) as { count: number }
    ).count;

    const monthlyRevenue = (
      db
        .prepare(
          `
          SELECT COALESCE(SUM(cost), 0) AS sum
          FROM Courses
          WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
        `
        )
        .get() as { sum: number }
    ).sum;

    return {
      activeUsers,
      weeklySessions,
      monthlyRevenue,
    };
  });
}
