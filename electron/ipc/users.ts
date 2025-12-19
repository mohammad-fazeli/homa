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
import { rfidConnect } from "../ipc/rfid";

export function registerUserHandlers() {
  ipcMain.handle(
    "add-user",
    async (
      event,
      user: UserCreateInput,
      course?: { cost: number; sessions: number },
      sessions?: string[]
    ): Promise<UserFindByIdResult> => {
      const newUser = await UserModel.create(user);
      if (!newUser) throw new Error("کاربر یافت نشد");

      if (course && course.cost && course.cost) {
        const newCourse = await CourseModel.create({
          ...course,
          userId: newUser.id,
        });

        if (sessions && sessions.length > 0) {
          for (const session of sessions) {
            await SessionModel.create({
              courseId: newCourse.id,
              date: session,
              used: 0,
              usedAt: null,
            });
          }
        }
      }

      return newUser;
    }
  );

  ipcMain.handle(
    "get-user",
    async (event, userId: number): Promise<UserFindByIdResult> => {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("کاربر یافت نشد");

      return user;
    }
  );

  ipcMain.handle(
    "get-users",
    async (event, page: number, limit: number): Promise<UserFindAllResult> => {
      return await UserModel.findAll(page, limit);
    }
  );

  ipcMain.handle(
    "update-user",
    async (
      event,
      updatedUser: UserUpdateInput,
      course?: { cost: number; sessions: number; id: number },
      sessions?: SessionUpdateInput[]
    ): Promise<UserFindByIdResult> => {
      const existing = await UserModel.findById(updatedUser.id);
      if (!existing) throw new Error("کاربر یافت نشد");

      const user = await UserModel.update(updatedUser);
      if (!user) throw new Error("کاربر یافت نشد");

      if (course) {
        CourseModel.update(course);
        if (sessions) {
          SessionModel.update(course?.id, sessions);
        }
      }

      return user;
    }
  );

  ipcMain.handle("delete-user", async (_event, userId: number) => {
    return await UserModel.delete(userId);
  });

  ipcMain.handle(
    "use-session",
    async (
      _event,
      uidCart: string
    ): Promise<{
      success: boolean;
      message: string;
    }> => {
      const user = UserModel.findByUidCart(uidCart);

      if (!user) {
        return { success: false, message: "کارت معتبر نیست" };
      }

      const sessions = user.course?.sessions;

      if (!sessions) {
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

      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      ).getTime();

      const validSessions = sessions.filter((session) => {
        const sessionTs = new Date(session.date).getTime();

        const isToday = sessionTs >= startOfToday && sessionTs < endOfToday;

        if (!isToday) return false;

        const inTolerance =
          sessionTs >= nowTs - toleranceMs && sessionTs <= nowTs + toleranceMs;

        return inTolerance;
      });

      if (validSessions.length === 0) {
        return {
          success: false,
          message: "جلسه ای یافت نشد.",
        };
      }

      if (validSessions[0].used === 0) {
        SessionModel.useSession(
          validSessions[0].id,
          new Date().toLocaleString()
        );
        return {
          success: true,
          message: "جلسه با موفقیت ثبت شد",
        };
      } else {
        return {
          success: true,
          message: "جلسه استفاده شده است.",
        };
      }
    }
  );

  ipcMain.handle("check-device", (_event) => {
    return rfidConnect;
  });
}
