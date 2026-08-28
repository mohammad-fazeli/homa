import { db } from "../connection";
import type {
  ClassGroupDetail,
  ClassGroupGenerateInput,
  ClassGroupGenerateResult,
  ClassGroupMemberItem,
  ClassGroupWriteInput,
} from "../types";
import {
  countAddsAtHour,
  normalizeWeekdays,
  parseWeekdays,
  planGroupSessionAdds,
  serializeWeekdays,
  uniquePlanDates,
} from "../../../shared/groups";
import { generateRecurringDates, normalizeSlotMinutes, toIsoDate } from "../../../shared/dates";
import { holidayConflict } from "../../../shared/holidays";
import { occupiesSlot } from "../../../shared/session";
import { countRoomOccupancy, isInstructorBusy } from "../../lib/session-match";
import { CourseModel } from "./CourseModel";
import { CourseTemplateModel } from "./CourseTemplateModel";
import { InstructorModel } from "./InstructorModel";
import { PaymentModel } from "./PaymentModel";
import { RoomModel } from "./RoomModel";
import { SessionLogModel } from "./SessionLogModel";
import { SessionModel } from "./SessionModel";
import { readSettings } from "../../settings-store";
import { DEFAULT_TOLERANCE_MINUTES } from "../../ipc/settings";
import { HolidayModel } from "./HolidayModel";
import { UserModel } from "./UserModel";

function parseLocalStart(value?: string): Date {
  if (!value?.trim()) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
      0,
      0,
      0
    );
  }
  return new Date(toIsoDate(value));
}

function clampHour(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const hour = Math.floor(Number(value));
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function mapGroupRow(row: any, members: ClassGroupMemberItem[]): ClassGroupDetail {
  return {
    id: row.id,
    name: row.name,
    roomId: row.roomId ?? null,
    instructorId: row.instructorId ?? null,
    templateId: row.templateId ?? null,
    color: row.color || row.roomColor || "#14635c",
    notes: row.notes ?? null,
    weekdays: parseWeekdays(row.weekdays),
    hour: clampHour(row.hour),
    sessions: Number(row.sessions) || 0,
    cost: Number(row.cost) || 0,
    roomName: row.roomName ?? null,
    roomColor: row.roomColor ?? null,
    roomCapacity: row.roomCapacity ?? null,
    instructorName: row.instructorName ?? null,
    templateName: row.templateName ?? null,
    memberCount: members.length,
    members,
  };
}

const GROUP_SELECT = `
  SELECT
    g.*,
    r.name AS roomName,
    r.color AS roomColor,
    r.capacity AS roomCapacity,
    CASE
      WHEN i.id IS NULL THEN NULL
      ELSE i.firstName || ' ' || i.lastName
    END AS instructorName,
    t.name AS templateName
  FROM ClassGroups g
  LEFT JOIN Rooms r ON r.id = g.roomId
  LEFT JOIN Instructors i ON i.id = g.instructorId
  LEFT JOIN CourseTemplates t ON t.id = g.templateId
`;

function loadMembers(groupId: number): ClassGroupMemberItem[] {
  const rows = db
    .prepare(
      `
      SELECT
        m.id,
        m.groupId,
        m.userId,
        m.courseId,
        u.firstName,
        u.lastName,
        u.phone,
        COALESCE(c.sessions, 0) AS totalSessions,
        COALESCE(c.sessions, 0) - COALESCE((
          SELECT COUNT(*) FROM Sessions s
          WHERE s.courseId = c.id AND s.used = 1
        ), 0) AS remainingSessions
      FROM ClassGroupMembers m
      JOIN Users u ON u.id = m.userId
      LEFT JOIN Courses c ON c.id = m.courseId
      WHERE m.groupId = ?
      ORDER BY u.lastName ASC, u.firstName ASC
    `
    )
    .all(groupId) as any[];

  return rows.map((row) => ({
    id: row.id,
    groupId: row.groupId,
    userId: row.userId,
    courseId: row.courseId ?? null,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    totalSessions: Number(row.totalSessions) || 0,
    remainingSessions: Math.max(0, Number(row.remainingSessions) || 0),
  }));
}

function remainingOpenSlots(courseId: number, sessionCap: number): number {
  const sessions = db
    .prepare(`SELECT status, used FROM Sessions WHERE courseId = ?`)
    .all(courseId) as Array<{ status?: string; used: 0 | 1 }>;
  const occupying = sessions.filter((session) =>
    occupiesSlot(session.status, session.used)
  ).length;
  return Math.max(0, sessionCap - occupying);
}

function ensureMemberCourse(
  userId: number,
  group: ClassGroupDetail,
  paidNow: boolean
) {
  let course = CourseModel.findByUserAndGroup(userId, group.id);
  if (!course) {
    course = CourseModel.create({
      userId,
      cost: group.cost,
      sessions: Math.max(1, group.sessions),
      title: group.name,
      roomId: group.roomId,
      instructorId: group.instructorId,
      templateId: group.templateId,
      notes: group.notes,
      groupId: group.id,
    });
    SessionLogModel.create({
      userId,
      change: group.cost,
      previousValue: 0,
      newValue: group.cost,
      description: `ثبت دوره گروه «${group.name}»`,
    });
    if (paidNow && group.cost > 0) {
      PaymentModel.create({
        userId,
        courseId: course.id,
        amount: group.cost,
        method: "cash",
        note: `پرداخت هنگام عضویت در «${group.name}»`,
      });
    }
  } else {
    CourseModel.update({
      id: course.id,
      cost: course.cost,
      sessions: Math.max(course.sessions, group.sessions),
      title: group.name,
      roomId: group.roomId,
      instructorId: group.instructorId,
      templateId: group.templateId,
      groupId: group.id,
    });
  }
  return course;
}

export const ClassGroupModel = {
  list(): ClassGroupDetail[] {
    const rows = db.prepare(`${GROUP_SELECT} ORDER BY g.id DESC`).all() as any[];
    return rows.map((row) => mapGroupRow(row, loadMembers(row.id)));
  },

  findById(id: number): ClassGroupDetail | null {
    const row = db.prepare(`${GROUP_SELECT} WHERE g.id = ?`).get(id);
    if (!row) return null;
    return mapGroupRow(row, loadMembers(id));
  },

  save(data: ClassGroupWriteInput): ClassGroupDetail {
    const name = data.name.trim();
    if (!name) throw new Error("نام گروه را وارد کنید");

    const template =
      data.templateId != null
        ? CourseTemplateModel.findById(data.templateId)
        : null;
    const sessions = Math.max(
      1,
      Math.floor(
        Number(
          data.sessions ?? template?.sessions ?? 8
        ) || 8
      )
    );
    const cost = Math.max(
      0,
      Math.floor(Number(data.cost ?? template?.cost ?? 0) || 0)
    );
    const weekdays = serializeWeekdays(data.weekdays ?? []);
    const hour = clampHour(data.hour);
    const color = data.color?.trim() || "#14635c";
    const roomId = data.roomId ?? null;
    const instructorId = data.instructorId ?? null;
    const templateId = data.templateId ?? null;
    const notes = data.notes?.trim() || null;

    if (data.id && data.id > 0) {
      db.prepare(
        `
        UPDATE ClassGroups
        SET name = ?, roomId = ?, instructorId = ?, templateId = ?, color = ?,
            notes = ?, weekdays = ?, hour = ?, sessions = ?, cost = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(
        name,
        roomId,
        instructorId,
        templateId,
        color,
        notes,
        weekdays,
        hour,
        sessions,
        cost,
        data.id
      );

      const members = db
        .prepare(`SELECT userId, courseId FROM ClassGroupMembers WHERE groupId = ?`)
        .all(data.id) as Array<{ userId: number; courseId: number | null }>;
      for (const member of members) {
        if (!member.courseId) continue;
        const course = CourseModel.findById(member.courseId);
        if (!course) continue;
        CourseModel.update({
          id: course.id,
          cost: course.cost,
          sessions: Math.max(course.sessions, sessions),
          title: name,
          roomId,
          instructorId,
          templateId,
          groupId: data.id,
        });
      }

      return this.findById(data.id)!;
    }

    const result = db
      .prepare(
        `
        INSERT INTO ClassGroups (
          name, roomId, instructorId, templateId, color, notes, weekdays,
          hour, sessions, cost, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(
        name,
        roomId,
        instructorId,
        templateId,
        color,
        notes,
        weekdays,
        hour,
        sessions,
        cost
      );

    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number) {
    db.prepare(`UPDATE Courses SET groupId = NULL WHERE groupId = ?`).run(id);
    return db.prepare(`DELETE FROM ClassGroups WHERE id = ?`).run(id).changes;
  },

  addMember(groupId: number, userId: number, paidNow = true): ClassGroupDetail {
    const group = this.findById(groupId);
    if (!group) throw new Error("گروه پیدا نشد");
    const user = UserModel.findById(userId);
    if (!user) throw new Error("مشتری پیدا نشد");

    if (group.members.some((member) => member.userId === userId)) {
      throw new Error("این مشتری از قبل در گروه است");
    }

    if (
      group.roomCapacity != null &&
      group.memberCount >= group.roomCapacity
    ) {
      throw new Error(
        `ظرفیت «${group.roomName}» ${group.roomCapacity.toLocaleString("fa-IR")} نفر است؛ این گروه پر است`
      );
    }

    const run = db.transaction(() => {
      const course = ensureMemberCourse(userId, group, paidNow);
      db.prepare(
        `
        INSERT INTO ClassGroupMembers (groupId, userId, courseId, createdAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `
      ).run(groupId, userId, course.id);
    });
    run();

    return this.findById(groupId)!;
  },

  removeMember(groupId: number, userId: number): ClassGroupDetail {
    db.prepare(
      `DELETE FROM ClassGroupMembers WHERE groupId = ? AND userId = ?`
    ).run(groupId, userId);
    const group = this.findById(groupId);
    if (!group) throw new Error("گروه پیدا نشد");
    return group;
  },

  generate(input: ClassGroupGenerateInput): ClassGroupGenerateResult {
    const group = this.findById(input.groupId);
    if (!group) throw new Error("گروه پیدا نشد");
    if (group.members.length === 0) {
      throw new Error("ابتدا عضو به گروه اضافه کنید");
    }
    if (!group.roomId) {
      throw new Error("برای تولید جلسات، کلاس گروه را مشخص کنید");
    }

    const weekdays = normalizeWeekdays(input.weekdays ?? group.weekdays);
    const hour = clampHour(input.hour ?? group.hour);
    const count = Math.max(
      1,
      Math.floor(Number(input.count ?? group.sessions) || group.sessions)
    );
    if (weekdays.length === 0) {
      throw new Error("روزهای هفته را انتخاب کنید");
    }
    if (hour == null) {
      throw new Error("ساعت کلاس را انتخاب کنید");
    }

    const startDate = parseLocalStart(input.startDate);
    const { holidays, closedWeekdays } = HolidayModel.rules();
    const dates = generateRecurringDates({
      startDate,
      weekdays,
      hour,
      count,
      skipDate: (date) =>
        Boolean(holidayConflict(date, holidays, closedWeekdays)),
    });
    if (dates.length === 0) {
      throw new Error("روزهای انتخاب‌شده همگی تعطیل‌اند یا تاریخی ساخته نشد");
    }

    const members = group.members.map((member) => {
      const course = ensureMemberCourse(member.userId, group, false);
      if (member.courseId !== course.id) {
        db.prepare(
          `UPDATE ClassGroupMembers SET courseId = ? WHERE groupId = ? AND userId = ?`
        ).run(course.id, group.id, member.userId);
      }
      return {
        userId: member.userId,
        courseId: course.id,
        remaining: remainingOpenSlots(course.id, course.sessions),
      };
    });

    const existingSlots = db
      .prepare(
        `
        SELECT c.userId, s.date
        FROM Sessions s
        JOIN Courses c ON c.id = s.courseId
        WHERE c.groupId = ?
      `
      )
      .all(group.id) as Array<{ userId: number; date: string }>;

    const slotMinutes = normalizeSlotMinutes(
      readSettings().attendanceToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES
    );

    const adds = planGroupSessionAdds({
      dates,
      members,
      existingSlots,
      slotMinutes,
    });

    const occupancy = SessionModel.listOccupancy();
    const room = RoomModel.findById(group.roomId);
    const instructor = group.instructorId
      ? InstructorModel.findById(group.instructorId)
      : null;

    if (room) {
      for (const date of uniquePlanDates(adds, slotMinutes)) {
        const occupied = countRoomOccupancy(
          occupancy,
          date,
          room.id,
          [],
          slotMinutes
        );
        const adding = countAddsAtHour(adds, date, slotMinutes);
        if (occupied + adding > room.capacity) {
          throw new Error(
            `ظرفیت «${room.name}» در این ساعت پر است (${room.capacity.toLocaleString("fa-IR")} نفر)`
          );
        }
      }
    }

    if (instructor) {
      for (const date of uniquePlanDates(adds, slotMinutes)) {
        if (
          isInstructorBusy(
            occupancy,
            date,
            instructor.id,
            [],
            group.roomId,
            slotMinutes
          )
        ) {
          throw new Error(
            `مربی ${instructor.firstName} ${instructor.lastName} در این ساعت کلاس دیگری دارد`
          );
        }
      }
    }

    const insert = db.transaction(() => {
      for (const add of adds) {
        SessionModel.create({
          courseId: add.courseId,
          date: add.date.toISOString(),
          used: 0,
          usedAt: null,
          status: "scheduled",
          roomId: group.roomId,
          instructorId: group.instructorId,
        });
      }
    });
    insert();

    const skipped = members.reduce((sum, member) => sum + member.remaining, 0) - adds.length;

    return {
      created: adds.length,
      skipped: Math.max(0, skipped),
      group: this.findById(group.id)!,
    };
  },
};
