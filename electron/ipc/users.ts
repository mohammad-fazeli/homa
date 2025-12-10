import { ipcMain } from "electron";
import {
  UserCreateInput,
  UserFindAllResult,
  UserFindByIdResult,
  UserUpdateInput,
} from "../db/types";
import { UserModel } from "../db/models/UserModel";
import { CourseModel } from "../db/models/CourseModel";
import { SessionModel } from "../db/models/SessionModel";

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

      if (course) {
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
      updatedUser: UserUpdateInput
    ): Promise<UserFindByIdResult> => {
      const existing = await UserModel.findById(updatedUser.id);
      if (!existing) throw new Error("کاربر یافت نشد");

      const user = await UserModel.update(updatedUser);
      if (!user) throw new Error("کاربر یافت نشد");

      return user;
    }
  );

  ipcMain.handle("delete-user", async (event, userId: number) => {
    return await UserModel.delete(userId);
  });
}
