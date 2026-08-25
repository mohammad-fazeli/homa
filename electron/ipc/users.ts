import { ipcMain } from "electron";
import {
  SessionUpdateInput,
  UserCreateInput,
  UserFindAllResult,
  UserFindByIdResult,
  UserUpdateInput,
  UseSessionResult,
} from "../db/types";
import { UserModel } from "../db/models/UserModel";
import { CourseModel } from "../db/models/CourseModel";
import { SessionModel } from "../db/models/SessionModel";
import { SessionLogModel } from "../db/models/SessionLogModel";
import { toIsoDate } from "../../shared/dates";
import {
  isValidNationalId,
  isValidPhone,
  normalizeNationalId,
  normalizePhone,
} from "../../shared/validation";
import { resolveRfidSession } from "../lib/session-match";

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

function saveCourseForUser(
  userId: number,
  course: { cost: number; sessions: number; id?: number },
  sessions?: SessionUpdateInput[] | string[]
) {
  let courseId = course.id ?? -1;
  const existingCourse = courseId > 0 ? CourseModel.findById(courseId) : null;

  if (!existingCourse) {
    const created = CourseModel.create({
      userId,
      cost: course.cost,
      sessions: course.sessions,
    });
    courseId = created.id;
    SessionLogModel.create({
      userId,
      change: course.cost,
      previousValue: 0,
      newValue: course.cost,
      description: "ثبت دوره",
    });
  } else {
    CourseModel.update({ ...course, id: courseId });
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
    const mapped = sessions.map((session) => {
      if (typeof session === "string") {
        return {
          id: -1,
          courseId,
          date: toIsoDate(session),
          used: 0 as const,
          usedAt: null,
        };
      }
      return {
        ...session,
        courseId,
        date: toIsoDate(session.date),
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
      course?: { cost: number; sessions: number },
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
    (_event, page: number, limit: number, search = ""): UserFindAllResult => {
      return UserModel.findAll(page, limit, search);
    }
  );

  ipcMain.handle(
    "update-user",
    (
      _event,
      updatedUser: UserUpdateInput,
      course?: { cost: number; sessions: number; id: number },
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
      course: { cost: number; sessions: number; id?: number },
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
      SessionModel.assertNoConflicts([iso]);
      SessionModel.create({
        courseId: course.id,
        date: iso,
        used: 0,
        usedAt: null,
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

      const sessions = user.courses.flatMap((course) => course.sessions);
      const match = resolveRfidSession(sessions, new Date(), options);
      const userName = `${user.firstName} ${user.lastName}`;

      if (match.status === "none") {
        return {
          success: false,
          message: "جلسه‌ای وجود ندارد",
          code: "NO_SESSION",
          userName,
        };
      }

      if (match.status === "already_used") {
        return {
          success: true,
          message: "این جلسه قبلاً ثبت شده است.",
          code: "ALREADY_USED",
          sessionId: match.session.id,
          userName,
        };
      }

      if (match.status === "out_of_tolerance") {
        return {
          success: false,
          message: `جلسه‌ای در بازه ۲۰ دقیقه نیست. ثبت دستی حضور ${userName}؟`,
          code: "OUT_OF_TOLERANCE",
          sessionId: match.session.id,
          userName,
        };
      }

      SessionModel.useSession(match.session.id, new Date().toISOString());
      return {
        success: true,
        message: `حضور ${userName} ثبت شد`,
        code: "OK",
        sessionId: match.session.id,
        userName,
      };
    }
  );
}
