import { db } from "../connection";
import { addDays, startOfDay } from "../../lib/utils";
import { WEEKDAY_LABELS, saturdayWeekdayIndex } from "../../../shared/dates";
import {
  LOW_CREDIT_REMINDER_THRESHOLD,
  fillReminderTemplate,
  formatReminderAmount,
  isReminderChannel,
  isReminderKind,
  localDayKey,
  reminderItemKey,
  reminderSmsUrl,
  reminderWhatsAppUrl,
  resolveReminderTemplates,
} from "../../../shared/reminders";
import type {
  ReminderChannel,
  ReminderCounts,
  ReminderItem,
  ReminderKind,
  ReminderMarkSentInput,
  ReminderSnapshot,
} from "../types";
import { PaymentModel } from "./PaymentModel";
import { readSettings } from "../../settings-store";

function emptyCounts(): ReminderCounts {
  return { session_tomorrow: 0, low_credit: 0, debt: 0 };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fa-IR", {
    month: "long",
    day: "numeric",
  });
}

function loadSentToday(dayKey: string) {
  const rows = db
    .prepare(
      `
      SELECT userId, kind, sessionId, channel, sentAt
      FROM ReminderLogs
      WHERE dayKey = ?
      ORDER BY id DESC
    `
    )
    .all(dayKey) as Array<{
    userId: number;
    kind: string;
    sessionId: number | null;
    channel: string;
    sentAt: string;
  }>;

  const map = new Map<
    string,
    { sentAt: string; sentChannel: ReminderChannel }
  >();
  for (const row of rows) {
    if (!isReminderKind(row.kind) || !isReminderChannel(row.channel)) continue;
    const key = reminderItemKey(row.kind, row.userId, row.sessionId);
    if (!map.has(key)) {
      map.set(key, { sentAt: row.sentAt, sentChannel: row.channel });
    }
  }
  return map;
}

function attachSendState(
  item: Omit<ReminderItem, "sentAt" | "sentChannel" | "key"> & {
    kind: ReminderKind;
    userId: number;
    sessionId: number | null;
  },
  sent: ReturnType<typeof loadSentToday>
): ReminderItem {
  const key = reminderItemKey(item.kind, item.userId, item.sessionId);
  const prior = sent.get(key);
  return {
    ...item,
    key,
    sentAt: prior?.sentAt ?? null,
    sentChannel: prior?.sentChannel ?? null,
    whatsappUrl: reminderWhatsAppUrl(item.phone, item.message),
    smsUrl: reminderSmsUrl(item.phone, item.message),
  };
}

export const ReminderModel = {
  snapshot(): ReminderSnapshot {
    const stored = readSettings();
    const academyName = stored.academyName?.trim() || "هما";
    const templates = resolveReminderTemplates(stored.reminderTemplates);
    const sent = loadSentToday(localDayKey());
    const items = [
      ...this.tomorrowItems(academyName, templates.session_tomorrow, sent),
      ...this.lowCreditItems(academyName, templates.low_credit, sent),
      ...this.debtItems(academyName, templates.debt, sent),
    ];

    const counts = emptyCounts();
    const pendingCounts = emptyCounts();
    for (const item of items) {
      counts[item.kind] += 1;
      if (!item.sentAt) pendingCounts[item.kind] += 1;
    }

    return { academyName, templates, counts, pendingCounts, items };
  },

  counts(): ReminderCounts {
    const snapshot = this.snapshot();
    return snapshot.pendingCounts;
  },

  tomorrowItems(
    academy: string,
    template: string,
    sent: ReturnType<typeof loadSentToday>
  ): ReminderItem[] {
    const start = addDays(startOfDay(), 1);
    const end = addDays(start, 1);
    const rows = db
      .prepare(
        `
        SELECT
          s.id AS sessionId,
          s.date,
          u.id AS userId,
          u.firstName,
          u.lastName,
          u.phone,
          r.name AS roomName,
          CASE
            WHEN i.id IS NULL THEN NULL
            ELSE i.firstName || ' ' || i.lastName
          END AS instructorName
        FROM Sessions s
        JOIN Courses c ON c.id = s.courseId
        JOIN Users u ON u.id = c.userId
        LEFT JOIN Rooms r ON r.id = COALESCE(s.roomId, c.roomId)
        LEFT JOIN Instructors i ON i.id = COALESCE(s.instructorId, c.instructorId)
        WHERE datetime(s.date) >= datetime(?)
          AND datetime(s.date) < datetime(?)
          AND IFNULL(s.status, 'scheduled') != 'cancelled'
        ORDER BY s.date ASC, u.lastName ASC
      `
      )
      .all(start.toISOString(), end.toISOString()) as any[];

    return rows.map((row) => {
      const date = new Date(row.date);
      const weekday = WEEKDAY_LABELS[saturdayWeekdayIndex(date)] ?? "";
      const time = Number.isNaN(date.getTime()) ? "" : formatTime(date);
      const room = row.roomName ?? "";
      const instructor = row.instructorName ?? "";
      const message = fillReminderTemplate(template, {
        firstName: row.firstName,
        lastName: row.lastName,
        name: `${row.firstName} ${row.lastName}`,
        phone: row.phone,
        weekday,
        date: Number.isNaN(date.getTime()) ? "" : formatDate(date),
        time,
        room,
        instructor,
        remaining: "",
        debt: "",
        academy,
      });
      return attachSendState(
        {
          kind: "session_tomorrow",
          userId: row.userId,
          sessionId: row.sessionId,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          message,
          whatsappUrl: null,
          smsUrl: null,
          subtitle: [weekday, time, room].filter(Boolean).join(" · "),
        },
        sent
      );
    });
  },

  lowCreditItems(
    academy: string,
    template: string,
    sent: ReturnType<typeof loadSentToday>
  ): ReminderItem[] {
    const remaining = `
      COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = u.id), 0)
      - COALESCE((
        SELECT COUNT(*) FROM Sessions s
        JOIN Courses c ON s.courseId = c.id
        WHERE c.userId = u.id AND s.used = 1
      ), 0)
    `;
    const rows = db
      .prepare(
        `
        SELECT
          u.id AS userId,
          u.firstName,
          u.lastName,
          u.phone,
          COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = u.id), 0) AS totalSessions,
          (${remaining}) AS remainingSessions
        FROM Users u
        WHERE COALESCE((SELECT SUM(sessions) FROM Courses WHERE userId = u.id), 0) > 0
          AND (${remaining}) <= ?
        ORDER BY remainingSessions ASC, u.lastName ASC
      `
      )
      .all(LOW_CREDIT_REMINDER_THRESHOLD) as any[];

    return rows.map((row) => {
      const remainingText = Number(row.remainingSessions || 0).toLocaleString(
        "fa-IR"
      );
      const message = fillReminderTemplate(template, {
        firstName: row.firstName,
        lastName: row.lastName,
        name: `${row.firstName} ${row.lastName}`,
        phone: row.phone,
        weekday: "",
        date: "",
        time: "",
        room: "",
        instructor: "",
        remaining: remainingText,
        debt: "",
        academy,
      });
      return attachSendState(
        {
          kind: "low_credit",
          userId: row.userId,
          sessionId: null,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          message,
          whatsappUrl: null,
          smsUrl: null,
          subtitle: `${remainingText} جلسه مانده`,
        },
        sent
      );
    });
  },

  debtItems(
    academy: string,
    template: string,
    sent: ReturnType<typeof loadSentToday>
  ): ReminderItem[] {
    return PaymentModel.listDebtors()
      .filter((row) => row.debt > 0)
      .map((row) => {
        const debt = formatReminderAmount(row.debt);
        const message = fillReminderTemplate(template, {
          firstName: row.firstName,
          lastName: row.lastName,
          name: `${row.firstName} ${row.lastName}`,
          phone: row.phone,
          weekday: "",
          date: "",
          time: "",
          room: "",
          instructor: "",
          remaining: "",
          debt,
          academy,
        });
        return attachSendState(
          {
            kind: "debt",
            userId: row.userId,
            sessionId: null,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            message,
            whatsappUrl: null,
            smsUrl: null,
            subtitle: debt,
          },
          sent
        );
      });
  },

  markSent(input: ReminderMarkSentInput) {
    if (!isReminderKind(input.kind)) throw new Error("نوع یادآوری نامعتبر است");
    if (!isReminderChannel(input.channel)) {
      throw new Error("روش ارسال نامعتبر است");
    }
    const user = db
      .prepare(`SELECT id FROM Users WHERE id = ?`)
      .get(input.userId);
    if (!user) throw new Error("مشتری پیدا نشد");

    const sentAt = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO ReminderLogs (
        userId, kind, channel, sessionId, message, dayKey, sentAt, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
    ).run(
      input.userId,
      input.kind,
      input.channel,
      input.sessionId ?? null,
      input.message,
      localDayKey(),
      sentAt
    );
    return this.snapshot();
  },
};
