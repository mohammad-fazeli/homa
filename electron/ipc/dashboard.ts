import { ipcMain } from "electron";
import { DashboardStats } from "../db/types";
import { db } from "../db";

export function registerDashboardHandlers() {
  // =====================================
  // DASHBOARD STATS
  // =====================================
  ipcMain.handle("dashboard:getStats", async (): Promise<DashboardStats> => {
    // Active Users (users with at least one course)
    const activeUsers = (
      db
        .prepare(
          `
          SELECT COUNT(DISTINCT u.id) AS count
          FROM Users u
          JOIN Courses c ON c.userId = u.id
        `
        )
        .get() as any
    ).count;

    const currentWeek = new Date();
    const day = currentWeek.getDay();
    const diff = (day + 1) % 7;
    currentWeek.setDate(currentWeek.getDate() - diff);

    const d = new Date(currentWeek);
    const dDay = d.getDay();
    const dDiff = (dDay + 1) % 7; // Saturday = 0
    d.setDate(d.getDate() - dDiff + 7);

    // Weekly Sessions
    const weeklySessions = (
      db
        .prepare(
          `
      SELECT COUNT(*) AS count
      FROM Sessions
      WHERE date BETWEEN ? AND ?
    `
        )
        .get(currentWeek.toLocaleString(), d.toLocaleString()) as any
    ).count;

    // Monthly Revenue
    const monthlyRevenue = (
      db
        .prepare(
          `
          SELECT COALESCE(SUM(cost), 0) AS sum
          FROM Courses
          WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
        `
        )
        .get() as any
    ).sum;

    return {
      activeUsers,
      weeklySessions,
      monthlyRevenue,
    };
  });
}
