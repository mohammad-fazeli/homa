import { ipcMain } from "electron";
import {
  DashboardOverview,
  DashboardSessionItem,
  DashboardStats,
  SessionResult,
} from "../db/types";
import { db } from "../db";
import { addDays, startOfWeekSaturday } from "../lib/utils";
import { SessionModel } from "../db/models/SessionModel";
import { RoomModel } from "../db/models/RoomModel";
import { occupiesSlot } from "../../shared/session";
import { cashInSql, refundSql } from "../../shared/finance";
import { photoUrlFor } from "../lib/photo-files";

const WEEKDAYS_FA = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

function toItem(session: SessionResult): DashboardSessionItem {
  return {
    id: session.id,
    userId: session.userId,
    title: session.title,
    date:
      typeof session.date === "string"
        ? session.date
        : new Date(session.date).toISOString(),
    used: session.used,
    usedAt: session.usedAt,
    status: session.status,
    roomName: session.roomName,
    roomColor: session.roomColor,
    instructorName: session.instructorName,
    courseTitle: session.courseTitle,
    photoUrl: photoUrlFor("user", session.userId),
  };
}

function startOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildOverview(): DashboardOverview {
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
  const todayStart = startOfToday();
  const todayEnd = addDays(todayStart, 1);

  const weeklySessions = (
    db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM Sessions
      WHERE datetime(date) >= datetime(?) AND datetime(date) < datetime(?)
        AND IFNULL(status, 'scheduled') != 'cancelled'
    `
      )
      .get(weekStart.toISOString(), weekEnd.toISOString()) as { count: number }
  ).count;

  const monthlyRevenue = (
    db
      .prepare(
        `
        SELECT COALESCE(SUM(${cashInSql()}) - SUM(${refundSql()}), 0) AS sum
        FROM Payments
        WHERE strftime('%Y-%m', paidAt) = strftime('%Y-%m', 'now')
      `
      )
      .get() as { sum: number }
  ).sum;

  const remainingSessions = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM Sessions WHERE used = 0 AND IFNULL(status, 'scheduled') != 'cancelled'`
      )
      .get() as { count: number }
  ).count;

  const todaySessions = SessionModel.findAll(
    todayStart.toISOString(),
    todayEnd.toISOString()
  ).map(toItem);

  const weekRows = SessionModel.findAll(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const weeklyBreakdown = WEEKDAYS_FA.map((label, day) => {
    const dayStart = addDays(weekStart, day);
    const dayEnd = addDays(dayStart, 1);
    const inDay = weekRows.filter((session) => {
      const t = new Date(session.date).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    return {
      day,
      label,
      total: inDay.length,
      used: inDay.filter((session) => session.used === 1).length,
    };
  });

  const attentionRows = db
    .prepare(
      `
      SELECT
        u.id,
        u.firstName,
        u.lastName,
        COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = u.id), 0) AS totalSessions,
        COALESCE((
          SELECT COUNT(*)
          FROM Sessions s
          JOIN Courses c ON s.courseId = c.id
          WHERE c.userId = u.id AND s.used = 1
        ), 0) AS usedSessions,
        EXISTS (
          SELECT 1 FROM Courses c
          WHERE c.userId = u.id
            AND c.expiresAt IS NOT NULL AND TRIM(c.expiresAt) != ''
            AND datetime(c.expiresAt) < datetime('now')
        ) AS expired
      FROM Users u
      WHERE EXISTS (SELECT 1 FROM Courses c WHERE c.userId = u.id)
    `
    )
    .all() as Array<{
    id: number;
    firstName: string;
    lastName: string;
    totalSessions: number;
    usedSessions: number;
    expired: number;
  }>;

  const attentionUsers = attentionRows
    .map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      totalSessions: row.totalSessions,
      remainingSessions: Math.max(0, row.totalSessions - row.usedSessions),
      expired: Boolean(row.expired),
      photoUrl: photoUrlFor("user", row.id),
    }))
    .filter(
      (row) =>
        row.expired || (row.totalSessions > 0 && row.remainingSessions <= 2)
    )
    .sort((a, b) => a.remainingSessions - b.remainingSessions)
    .slice(0, 8);

  const rooms = RoomModel.list();
  const roomOccupancy = rooms.map((room) => {
    const booked = todaySessions.filter(
      (session) =>
        session.roomName === room.name && occupiesSlot(session.status, session.used)
    ).length;
    const present = todaySessions.filter(
      (session) => session.roomName === room.name && session.status === "present"
    ).length;
    return {
      roomId: room.id,
      name: room.name,
      color: room.color,
      capacity: room.capacity,
      booked,
      present,
    };
  });

  const stats: DashboardStats = {
    activeUsers,
    weeklySessions,
    monthlyRevenue,
    todayCount: todaySessions.length,
    attendedToday: todaySessions.filter((session) => session.used === 1).length,
    remainingSessions,
  };

  return {
    stats,
    todaySessions,
    upcomingSessions: SessionModel.findUpcoming(8).map(toItem),
    recentAttendance: SessionModel.findRecentUsed(8).map(toItem),
    weeklyBreakdown,
    attentionUsers,
    roomOccupancy,
  };
}

export function registerDashboardHandlers() {
  ipcMain.handle("dashboard:getStats", (): DashboardStats => buildOverview().stats);
  ipcMain.handle("dashboard:getOverview", (): DashboardOverview => buildOverview());
}
