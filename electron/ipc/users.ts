import { ipcMain } from "electron";
import {
  CourseWriteInput,
  SessionStatus,
  SessionUpdateInput,
  UserCreateInput,
  UserFilterCounts,
  UserFindAllResult,
  UserFindByIdResult,
  UserListFilter,
  UserUpdateInput,
  UseSessionResult,
} from "../db/types";
import { UserModel } from "../db/models/UserModel";
import { CourseModel } from "../db/models/CourseModel";
import { SessionModel } from "../db/models/SessionModel";
import { SessionLogModel } from "../db/models/SessionLogModel";
import { PaymentModel } from "../db/models/PaymentModel";
import { toIsoDate } from "../../shared/dates";
import {
  isValidNationalId,
  isValidPhone,
  normalizeNationalId,
  normalizePhone,
} from "../../shared/validation";
import { resolveRfidSession } from "../lib/session-match";
import { readSettings } from "../settings-store";

function countsForUser(
  user: UserFindByIdResult,
  extraUsedId?: number,
  extraUnusedId?: number
) {
  const totalSessions = user.courses.reduce(
    (sum, course) => sum + course.totalSessions,
    0
  );
  const usedSessions = user.courses.reduce(
    (sum, course) =>
      sum +
      course.sessions.filter((session) => {
        if (session.id === extraUsedId) return true;
        if (session.id === extraUnusedId) return false;
        return session.used === 1;
      }).length,
    0
  );
  return {
    totalSessions,
    remainingSessions: Math.max(0, totalSessions - usedSessions),
  };
}

function resultForSession(
  sessionId: number,
  code: UseSessionResult["code"],
  message: string,
  success: boolean,
  extraUsedId?: number,
  extraUnusedId?: number
): UseSessionResult {
  const session = SessionModel.findById(sessionId);
  if (!session) {
    return { success: false, message: "جلسه پیدا نشد", code: "NO_SESSION" };
  }
  const user = UserModel.findById(session.userId);
  if (!user) {
    return { success: false, message: "کاربر یافت نشد", code: "NO_SESSION" };
  }
  const userName = `${user.firstName} ${user.lastName}`;
  return {
    success,
    message,
    code,
    sessionId,
    userName,
    photoUrl: user.photoUrl ?? null,
    ...countsForUser(user, extraUsedId, extraUnusedId),
  };
}

function validateUserInput(user: { phone: string; nationalId: string }) {
  if (!isValidPhone(user.phone)) {
    throw new Error("شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود");
  }
  if (!isValidNationalId(user.nationalId)) {
    throw new Error("کد ملی نامعتبر است");
  }
}

function normalizeUser<T extends { phone: string; nationalId: string }>(user: T) {
  return {
    ...user,
    phone: normalizePhone(user.phone),
    nationalId: normalizeNationalId(user.nationalId),
  };
}

export function saveCourseForUser(
  userId: number,
  course: CourseWriteInput,
  sessions?: SessionUpdateInput[] | string[]
) {
  let courseId = course.id ?? -1;
  const existingCourse = courseId > 0 ? CourseModel.findById(courseId) : null;
  const payload = {
    userId,
    cost: course.cost,
    sessions: course.sessions,
    title: course.title,
    roomId: course.roomId,
    instructorId: course.instructorId,
    templateId: course.templateId,
    expiresAt: course.expiresAt,
    notes: course.notes,
    groupId: course.groupId,
  };

  if (!existingCourse) {
    const created = CourseModel.create(payload);
    courseId = created.id;
    SessionLogModel.create({
      userId,
      change: course.cost,
      previousValue: 0,
      newValue: course.cost,
      description: "ثبت دوره",
    });
    if (course.paidNow !== false && course.cost > 0) {
      PaymentModel.create({
        userId,
        courseId,
        amount: course.cost,
        method: "cash",
        note: "پرداخت هنگام ثبت دوره",
      });
    }
  } else {
    CourseModel.update({ ...payload, id: courseId });
    if (existingCourse.cost !== course.cost) {
      SessionLogModel.create({
        userId,
        change: course.cost - existingCourse.cost,
        previousValue: existingCourse.cost,
        newValue: course.cost,
        description: "به‌روزرسانی هزینه دوره",
      });
    }
  }

  if (sessions) {
    const saved = CourseModel.findById(courseId);
    const mapped = sessions.map((session) => {
      if (typeof session === "string") {
        return {
          id: -1,
          courseId,
          date: toIsoDate(session),
          used: 0 as const,
          usedAt: null,
          status: "scheduled" as const,
          roomId: saved?.roomId ?? null,
          instructorId: saved?.instructorId ?? null,
        };
      }
      return {
        ...session,
        courseId,
        date: toIsoDate(session.date),
        roomId: session.roomId ?? saved?.roomId ?? null,
        instructorId: session.instructorId ?? saved?.instructorId ?? null,
      };
    });
    SessionModel.update(courseId, mapped);
  }

  return courseId;
}

export function registerUserHandlers() {
  ipcMain.handle(
    "add-user",
    (
      _event,
      user: UserCreateInput,
      course?: CourseWriteInput,
      sessions?: string[]
    ): UserFindByIdResult => {
      validateUserInput(user);
      const newUser = UserModel.create(normalizeUser(user));
      if (!newUser) throw new Error("ثبت کاربر ناموفق بود");

      const shouldCreateCourse =
        course && (Number(course.cost) > 0 || Number(course.sessions) > 0);

      if (shouldCreateCourse && course) {
        saveCourseForUser(newUser.id, course, sessions);
      }

      return UserModel.findById(newUser.id) ?? newUser;
    }
  );

  ipcMain.handle("get-user", (_event, userId: number): UserFindByIdResult => {
    const user = UserModel.findById(userId);
    if (!user) throw new Error("کاربر یافت نشد");
    return user;
  });

  ipcMain.handle(
    "get-users",
    (
      _event,
      page: number,
      limit: number,
      search = "",
      filter: UserListFilter = "all"
    ): UserFindAllResult => {
      return UserModel.findAll(page, limit, search, filter);
    }
  );

  ipcMain.handle(
    "get-user-filter-counts",
    (): UserFilterCounts => UserModel.filterCounts()
  );

  ipcMain.handle(
    "update-user",
    (
      _event,
      updatedUser: UserUpdateInput,
      course?: CourseWriteInput & { id: number },
      sessions?: SessionUpdateInput[]
    ): UserFindByIdResult => {
      validateUserInput(updatedUser);
      const existing = UserModel.findById(updatedUser.id);
      if (!existing) throw new Error("کاربر یافت نشد");

      const user = UserModel.update(normalizeUser(updatedUser));
      if (!user) throw new Error("به‌روزرسانی کاربر ناموفق بود");

      if (course) {
        saveCourseForUser(updatedUser.id, course, sessions);
      }

      return UserModel.findById(updatedUser.id) ?? user;
    }
  );

  ipcMain.handle(
    "save-course",
    (
      _event,
      userId: number,
      course: CourseWriteInput,
      sessions?: SessionUpdateInput[]
    ) => {
      const user = UserModel.findById(userId);
      if (!user) throw new Error("کاربر یافت نشد");
      saveCourseForUser(userId, course, sessions);
      return UserModel.findById(userId);
    }
  );

  ipcMain.handle("delete-course", (_event, courseId: number) => {
    return CourseModel.delete(courseId);
  });

  ipcMain.handle("delete-user", (_event, userId: number) => {
    return UserModel.delete(userId);
  });

  ipcMain.handle(
    "add-session",
    (_event, userId: number, dateIso: string) => {
      const user = UserModel.findById(userId);
      if (!user) throw new Error("کاربر یافت نشد");
      const course = user.courses[0];
      if (!course) throw new Error("ابتدا یک دوره برای مشتری بسازید");

      const iso = toIsoDate(dateIso);
      SessionModel.assertSlotAvailable([iso], {
        roomId: course.roomId ?? null,
        instructorId: course.instructorId ?? null,
      });
      SessionModel.create({
        courseId: course.id,
        date: iso,
        used: 0,
        usedAt: null,
        status: "scheduled",
        roomId: course.roomId ?? null,
        instructorId: course.instructorId ?? null,
      });
      CourseModel.update({
        id: course.id,
        cost: course.cost,
        sessions: course.totalSessions + 1,
      });
      return UserModel.findById(userId);
    }
  );

  ipcMain.handle("remove-last-session", (_event, userId: number) => {
    const user = UserModel.findById(userId);
    if (!user) throw new Error("کاربر یافت نشد");
    const last = SessionModel.findLastUnused(userId);
    if (!last) throw new Error("جلسهٔ استفاده‌نشده‌ای برای حذف نیست");
    SessionModel.delete(last.id);
    const course = CourseModel.findById(last.courseId);
    if (course) {
      CourseModel.update({
        id: course.id,
        cost: course.cost,
        sessions: Math.max(0, course.sessions - 1),
      });
    }
    return UserModel.findById(userId);
  });

  ipcMain.handle(
    "use-session",
    (
      _event,
      uidCart: string,
      options?: { force?: boolean; sessionId?: number }
    ): UseSessionResult => {
      const user = UserModel.findByUidCart(uidCart);

      if (!user) {
        return {
          success: false,
          message: "کارت معتبر نیست",
          code: "INVALID_CARD",
        };
      }

      const sessions = user.courses.flatMap((course) =>
        course.sessions.map((session) => ({
          id: session.id,
          date: session.date,
          used: session.used,
          status: session.status,
        }))
      );
      const toleranceMinutes = readSettings().attendanceToleranceMinutes ?? 20;
      const match = resolveRfidSession(sessions, new Date(), {
        ...options,
        toleranceMinutes,
      });
      const userName = `${user.firstName} ${user.lastName}`;
      const counts = (extraUsedId?: number) => countsForUser(user, extraUsedId);

      if (match.status === "none") {
        return {
          success: false,
          message: "جلسه‌ای برای این کارت وجود ندارد",
          code: "NO_SESSION",
          userName,
          ...counts(),
        };
      }

      if (match.status === "already_used") {
        return {
          success: true,
          message: "این جلسه قبلاً ثبت شده است.",
          code: "ALREADY_USED",
          sessionId: match.session.id,
          userName,
          ...counts(),
        };
      }

      if (match.status === "out_of_tolerance") {
        const windowMin = toleranceMinutes ?? 20;
        return {
          success: false,
          message: `جلسه‌ای در بازه ${windowMin.toLocaleString("fa-IR")} دقیقه نیست. ثبت دستی حضور ${userName}؟`,
          code: "OUT_OF_TOLERANCE",
          sessionId: match.session.id,
          userName,
          ...counts(),
        };
      }

      SessionModel.useSession(match.session.id, new Date().toISOString());
      return {
        success: true,
        message: `حضور ${userName} ثبت شد`,
        code: "OK",
        sessionId: match.session.id,
        userName,
        ...counts(match.session.id),
      };
    }
  );

  ipcMain.handle("mark-session", (_event, sessionId: number): UseSessionResult => {
    const session = SessionModel.findById(sessionId);
    if (!session) {
      return { success: false, message: "جلسه پیدا نشد", code: "NO_SESSION" };
    }
    if (session.used === 1) {
      return resultForSession(
        sessionId,
        "ALREADY_USED",
        "این جلسه قبلاً ثبت شده است.",
        true
      );
    }
    SessionModel.useSession(sessionId, new Date().toISOString());
    return resultForSession(
      sessionId,
      "OK",
      `حضور ${session.title} ثبت شد`,
      true,
      sessionId
    );
  });

  ipcMain.handle(
    "unmark-session",
    (_event, sessionId: number): UseSessionResult => {
      const session = SessionModel.findById(sessionId);
      if (!session) {
        return { success: false, message: "جلسه پیدا نشد", code: "NO_SESSION" };
      }
      if (session.used === 0) {
        return resultForSession(
          sessionId,
          "OK",
          "این جلسه هنوز ثبت نشده است.",
          true
        );
      }
      SessionModel.unuseSession(sessionId);
      return resultForSession(
        sessionId,
        "UNMARKED",
        `حضور ${session.title} لغو شد`,
        true,
        undefined,
        sessionId
      );
    }
  );

  ipcMain.handle(
    "set-session-status",
    (_event, sessionId: number, status: SessionStatus): UseSessionResult => {
      const session = SessionModel.findById(sessionId);
      if (!session) {
        return { success: false, message: "جلسه پیدا نشد", code: "NO_SESSION" };
      }
      if (status === "cancelled") {
        SessionModel.setStatus(sessionId, "cancelled");
        return resultForSession(
          sessionId,
          "UNMARKED",
          `جلسه ${session.title} لغو شد`,
          true,
          undefined,
          sessionId
        );
      }
      if (status === "absent") {
        SessionModel.setStatus(sessionId, "absent");
        return resultForSession(
          sessionId,
          "OK",
          `غیبت ${session.title} ثبت شد`,
          true,
          sessionId
        );
      }
      if (status === "present" || status === "makeup") {
        SessionModel.setStatus(sessionId, status);
        return resultForSession(
          sessionId,
          "OK",
          `حضور ${session.title} ثبت شد`,
          true,
          sessionId
        );
      }
      SessionModel.setStatus(sessionId, "scheduled");
      return resultForSession(
        sessionId,
        "UNMARKED",
        `جلسه ${session.title} به رزرو برگشت`,
        true,
        undefined,
        sessionId
      );
    }
  );
}
