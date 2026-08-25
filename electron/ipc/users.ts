import { ipcMain } from "electron";
import {
  SessionUpdateInput,
  UserCreateInput,
  UserFindAllResult,
  UserFindByIdResult,
  UserUpdateInput,
} from "../db/types";
import { UserModel } from "../db/models/UserModel";
import { CourseModel } from "../db/models/CourseModel";
import { SessionModel } from "../db/models/SessionModel";
import { SessionLogModel } from "../db/models/SessionLogModel";
import { rfidConnect } from "../ipc/rfid";

function toIsoDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
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
      const newUser = UserModel.create(user);
      if (!newUser) throw new Error("ثبت کاربر ناموفق بود");

      const shouldCreateCourse =
        course && (Number(course.cost) > 0 || Number(course.sessions) > 0);

      if (shouldCreateCourse && course) {
        const newCourse = CourseModel.create({
          ...course,
          userId: newUser.id,
        });

        SessionLogModel.create({
          userId: newUser.id,
          change: course.cost,
          previousValue: 0,
          newValue: course.cost,
          description: "ثبت دوره جدید",
        });

        if (sessions && sessions.length > 0) {
          for (const session of sessions) {
            SessionModel.create({
              courseId: newCourse.id,
              date: toIsoDate(session),
              used: 0,
              usedAt: null,
            });
          }
        }
      }

      return UserModel.findById(newUser.id) ?? newUser;
    }
  );

  ipcMain.handle(
    "get-user",
    (_event, userId: number): UserFindByIdResult => {
      const user = UserModel.findById(userId);
      if (!user) throw new Error("کاربر یافت نشد");
      return user;
    }
  );

  ipcMain.handle(
    "get-users",
    (
      _event,
      page: number,
      limit: number,
      search = ""
    ): UserFindAllResult => {
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
      const existing = UserModel.findById(updatedUser.id);
      if (!existing) throw new Error("کاربر یافت نشد");

      const user = UserModel.update(updatedUser);
      if (!user) throw new Error("به‌روزرسانی کاربر ناموفق بود");

      if (course) {
        let courseId = course.id;
        const existingCourse =
          courseId > 0 ? CourseModel.findById(courseId) : null;

        if (!existingCourse) {
          const created = CourseModel.create({
            userId: updatedUser.id,
            cost: course.cost,
            sessions: course.sessions,
          });
          courseId = created.id;
          SessionLogModel.create({
            userId: updatedUser.id,
            change: course.cost,
            previousValue: 0,
            newValue: course.cost,
            description: "ثبت دوره",
          });
        } else {
          CourseModel.update({ ...course, id: courseId });
          if (existingCourse.cost !== course.cost) {
            SessionLogModel.create({
              userId: updatedUser.id,
              change: course.cost - existingCourse.cost,
              previousValue: existingCourse.cost,
              newValue: course.cost,
              description: "به‌روزرسانی هزینه دوره",
            });
          }
        }

        if (sessions) {
          SessionModel.update(
            courseId,
            sessions.map((session) => ({
              ...session,
              courseId,
              date: toIsoDate(session.date),
            }))
          );
        }
      }

      return UserModel.findById(updatedUser.id) ?? user;
    }
  );

  ipcMain.handle("delete-user", (_event, userId: number) => {
    return UserModel.delete(userId);
  });

  ipcMain.handle(
    "use-session",
    (
      _event,
      uidCart: string
    ): {
      success: boolean;
      message: string;
    } => {
      const user = UserModel.findByUidCart(uidCart);

      if (!user) {
        return { success: false, message: "کارت معتبر نیست" };
      }

      const sessions = user.course?.sessions;

      if (!sessions || sessions.length === 0) {
        return {
          success: false,
          message: "جلسه‌ای وجود ندارد",
        };
      }

      const TOLERANCE_MINUTES = 20;
      const now = new Date();
      const nowTs = now.getTime();
      const toleranceMs = TOLERANCE_MINUTES * 60 * 1000;
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

      const validSessions = sessions.filter((session) => {
        const sessionTs = new Date(session.date).getTime();
        if (Number.isNaN(sessionTs)) return false;

        const isToday = sessionTs >= startOfToday && sessionTs < endOfToday;
        if (!isToday) return false;

        return (
          sessionTs >= nowTs - toleranceMs && sessionTs <= nowTs + toleranceMs
        );
      });

      if (validSessions.length === 0) {
        return {
          success: false,
          message: "جلسه‌ای در این بازه زمانی یافت نشد.",
        };
      }

      const target = validSessions.find((s) => s.used === 0) ?? validSessions[0];

      if (target.used === 0) {
        SessionModel.useSession(target.id, new Date().toISOString());
        return {
          success: true,
          message: `حضور ${user.firstName} ${user.lastName} ثبت شد`,
        };
      }

      return {
        success: true,
        message: "این جلسه قبلاً ثبت شده است.",
      };
    }
  );

  ipcMain.handle("check-device", () => rfidConnect);
}
