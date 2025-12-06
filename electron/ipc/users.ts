import { ipcMain } from "electron";
import { User, UserModel } from "../model/UserModel";
import { SessionLogModel } from "../model/SessionLogModel";
import { CourseModel } from "../model/CourseModel";
import { SessionModel } from "../model/SessionModel";

export function registerUserHandlers() {
  ipcMain.handle(
    "add-user",
    (
      event,
      user: Omit<User, "id">,
      course?: { cost: number; sessions: number },
      sessions?: Date[]
    ) => {
      const newUser = UserModel.create(user);
      if (course) {
        const newCourse = CourseModel.create({ ...course, userId: newUser.id });
        sessions?.forEach((session) => {
          SessionModel.create({ courseId: newCourse.id, date: session });
        });
      }
      return newUser;
    }
  );

  ipcMain.handle("get-user", (event, userId: number) => {
    const user = UserModel.findById(userId);
    if (!user) throw new Error("کاربر یافت نشد");

    return user;
  });

  ipcMain.handle("get-users", (event, page: number, limit: number) => {
    return UserModel.findAll(page, limit);
  });

  ipcMain.handle("update-user", (event, updatedUser) => {
    const existing: any = UserModel.findById(updatedUser.id);
    if (!existing) throw new Error("کاربر یافت نشد");

    const previous = existing.sessions;
    const next = updatedUser.sessions;
    const change = next - previous;

    // update user
    UserModel.update(updatedUser);

    // اگر تغییری در تعداد جلسه باشد → ثبت در لاگ
    if (change !== 0) {
      SessionLogModel.create({
        userId: updatedUser.id,
        change,
        previousValue: previous,
        newValue: next,
        description:
          change > 0
            ? `افزایش ${change} جلسه توسط منشی`
            : `کاهش ${Math.abs(change)} جلسه توسط منشی`,
      });
    }

    return UserModel.findAll();
  });

  ipcMain.handle("delete-user", (event, userId: number) => {
    UserModel.delete(userId);
    return UserModel.findAll();
  });

  ipcMain.handle(
    "decrease-user-sessions",
    (event, userId: number, change: number) => {
      const user: any = UserModel.findById(userId);
      if (!user) throw new Error("کاربر یافت نشد");

      const previous = user.sessions;
      const next = previous + change;

      UserModel.update({ ...user, sessions: next });

      SessionLogModel.create({
        userId,
        change,
        previousValue: previous,
        newValue: next,
        description: "مصرف جلسه",
      });

      return UserModel.findAll();
    }
  );
}
