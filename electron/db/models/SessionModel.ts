import { db } from "../connection";
import {
  SessionCreateInput,
  SessionResult,
  SessionStatus,
  SessionUpdateInput,
} from "../types";
import {
  countRoomOccupancy,
  isInstructorBusy,
  OccupancySession,
} from "../../lib/session-match";
import { normalizeStatus, usedFromStatus } from "../../../shared/session";
import { RoomModel } from "./RoomModel";
import { CourseModel } from "./CourseModel";
import { InstructorModel } from "./InstructorModel";
import { HolidayModel } from "./HolidayModel";

const SESSION_SELECT = `
  SELECT
    s.id,
    s.courseId,
    s.date,
    s.used,
    s.usedAt,
    s.status,
    s.roomId,
    s.instructorId,
    s.notes,
    s.createdAt,
    s.updatedAt,
    c.userId,
    c.title AS courseTitle,
    u.firstName,
    u.lastName,
    r.name AS roomName,
    r.color AS roomColor,
    CASE
      WHEN i.id IS NULL THEN NULL
      ELSE i.firstName || ' ' || i.lastName
    END AS instructorName
  FROM Sessions s
  JOIN Courses c ON s.courseId = c.id
  JOIN Users u ON c.userId = u.id
  LEFT JOIN Rooms r ON r.id = COALESCE(s.roomId, c.roomId)
  LEFT JOIN Instructors i ON i.id = COALESCE(s.instructorId, c.instructorId)
`;

function mapSessionRow(row: any): SessionResult {
  const status = normalizeStatus(row.status, row.used);
  return {
    id: row.id,
    courseId: row.courseId,
    date: row.date,
    used: row.used,
    usedAt: row.usedAt,
    status,
    roomId: row.roomId ?? null,
    instructorId: row.instructorId ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userId: row.userId,
    title: `${row.firstName} ${row.lastName}`,
    start: new Date(row.date),
    courseTitle: row.courseTitle || "دوره",
    roomName: row.roomName ?? null,
    roomColor: row.roomColor ?? null,
    instructorName: row.instructorName ?? null,
  };
}

export const SessionModel = {
  create(data: SessionCreateInput): SessionResult {
    const course = CourseModel.findById(data.courseId);
    const status = normalizeStatus(data.status, data.used);
    const roomId = data.roomId ?? course?.roomId ?? null;
    const instructorId = data.instructorId ?? course?.instructorId ?? null;

    const stmt = db.prepare(`
      INSERT INTO Sessions (
        courseId, date, used, usedAt, status, roomId, instructorId, notes,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      data.courseId,
      data.date,
      usedFromStatus(status),
      data.usedAt ?? null,
      status,
      roomId,
      instructorId,
      data.notes ?? null
    );

    return this.findById(result.lastInsertRowid as number)!;
  },

  findById(id: number): SessionResult | null {
    const row: any = db
      .prepare(`${SESSION_SELECT} WHERE s.id = ? LIMIT 1`)
      .get(id);
    if (!row) return null;
    return mapSessionRow(row);
  },

  listOccupancy(): OccupancySession[] {
    return db
      .prepare(
        `SELECT id, date, roomId, instructorId, status, used FROM Sessions`
      )
      .all() as OccupancySession[];
  },

  assertSlotAvailable(
    dates: Array<string | Date>,
    options: {
      roomId?: number | null;
      instructorId?: number | null;
      excludeIds?: number[];
      ignoreClosedDates?: Array<string | Date>;
    } = {}
  ) {
    this.assertOpenDates(dates, options.ignoreClosedDates);
    const existing = this.listOccupancy();
    const excludeIds = options.excludeIds ?? [];
    const room = options.roomId ? RoomModel.findById(options.roomId) : null;
    const instructor = options.instructorId
      ? InstructorModel.findById(options.instructorId)
      : null;

    for (const date of dates) {
      if (room) {
        const occupied = countRoomOccupancy(
          existing,
          date,
          room.id,
          excludeIds
        );
        if (occupied >= room.capacity) {
          throw new Error(
            `ظرفیت «${room.name}» در این ساعت پر است (${room.capacity.toLocaleString("fa-IR")} نفر)`
          );
        }
      }
      if (instructor && isInstructorBusy(
        existing,
        date,
        instructor.id,
        excludeIds,
        options.roomId ?? null
      )) {
        throw new Error(
          `مربی ${instructor.firstName} ${instructor.lastName} در این ساعت کلاس دیگری دارد`
        );
      }
    }
  },

  assertOpenDates(
    dates: Array<string | Date>,
    ignoreClosedDates?: Array<string | Date>
  ) {
    HolidayModel.assertOpenDates(dates, { ignoreDates: ignoreClosedDates });
  },

  update(courseId: number, data: SessionUpdateInput[]) {
    const course = CourseModel.findById(courseId);
    const existingRows = db
      .prepare(`SELECT id, date FROM Sessions WHERE courseId = ?`)
      .all(courseId) as Array<{ id: number; date: string }>;
    const existingIds = existingRows.map((row) => row.id);

    this.assertSlotAvailable(
      data.map((session) => session.date),
      {
        roomId: course?.roomId ?? null,
        instructorId: course?.instructorId ?? null,
        excludeIds: existingIds,
        ignoreClosedDates: existingRows.map((row) => row.date),
      }
    );

    const sync = db.transaction(() => {
      this.deletesByCourseId(courseId);
      for (const session of data) {
        this.create({
          courseId,
          date: session.date,
          used: session.used,
          usedAt: session.usedAt,
          status: session.status,
          roomId: session.roomId ?? course?.roomId ?? null,
          instructorId: session.instructorId ?? course?.instructorId ?? null,
          notes: session.notes,
        });
      }
    });
    sync();
  },

  setStatus(id: number, status: SessionStatus) {
    const used = usedFromStatus(status);
    db.prepare(
      `
      UPDATE Sessions
      SET status = ?,
          used = ?,
          usedAt = CASE
            WHEN ? = 1 THEN COALESCE(usedAt, ?)
            ELSE NULL
          END,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(status, used, used, new Date().toISOString(), id);
  },

  useSession(id: number, usedAt: string) {
    this.setStatus(id, "present");
    db.prepare(
      `UPDATE Sessions SET usedAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(usedAt, id);
  },

  unuseSession(id: number) {
    this.setStatus(id, "scheduled");
  },

  findLastUnused(userId: number) {
    const row: any = db
      .prepare(
        `
        SELECT s.*
        FROM Sessions s
        JOIN Courses c ON s.courseId = c.id
        WHERE c.userId = ? AND s.used = 0 AND IFNULL(s.status, 'scheduled') != 'cancelled'
        ORDER BY s.date DESC
        LIMIT 1
      `
      )
      .get(userId);
    return row ?? null;
  },

  deletesByCourseId(courseId: number) {
    db.prepare(`DELETE FROM Sessions WHERE courseId = ?`).run(courseId);
  },

  delete(id: number) {
    db.prepare(`DELETE FROM Sessions WHERE id = ?`).run(id);
  },

  findUpcoming(limit = 8): SessionResult[] {
    const rows = db
      .prepare(
        `
        ${SESSION_SELECT}
        WHERE s.used = 0
          AND IFNULL(s.status, 'scheduled') != 'cancelled'
          AND datetime(s.date) >= datetime('now')
        ORDER BY s.date ASC
        LIMIT ?
      `
      )
      .all(limit);
    return (rows as any[]).map(mapSessionRow);
  },

  findRecentUsed(limit = 8): SessionResult[] {
    const rows = db
      .prepare(
        `
        ${SESSION_SELECT}
        WHERE s.used = 1
        ORDER BY datetime(COALESCE(s.usedAt, s.date)) DESC
        LIMIT ?
      `
      )
      .all(limit);
    return (rows as any[]).map(mapSessionRow);
  },

  findAll(start: string | Date, end: string | Date): SessionResult[] {
    const startIso =
      start instanceof Date ? start.toISOString() : String(start);
    const endIso = end instanceof Date ? end.toISOString() : String(end);

    const rows = db
      .prepare(
        `
        ${SESSION_SELECT}
        WHERE datetime(s.date) BETWEEN datetime(?) AND datetime(?)
        ORDER BY s.date ASC
      `
      )
      .all(startIso, endIso);

    return (rows as any[]).map(mapSessionRow);
  },
};
