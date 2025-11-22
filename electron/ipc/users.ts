import { ipcMain } from "electron";
import { SessionLogModel, UserModel } from "../model";
import { UserAttributes } from "../model/UserModel";

export function registerUserHandlers() {
  ipcMain.handle("get-users", async () => {
    const users = await UserModel.findAll();
    return users.map((user) => user.dataValues);
  });

  ipcMain.handle(
    "get-user",
    async (event: Electron.IpcMainInvokeEvent, userId: number) => {
      const user: any = await UserModel.findByPk(userId, {
        include: [
          {
            model: SessionLogModel,
            as: "logs",
            order: [["createdAt", "DESC"]],
          },
        ],
      });
      if (!user) {
        throw new Error("کاربر یافت نشد");
      }
      return {
        ...user.dataValues,
        logs: user.dataValues.logs.map((l: any) => l.dataValues),
      };
    }
  );

  ipcMain.handle(
    "add-user",
    async (
      event: Electron.IpcMainInvokeEvent,
      user: Omit<UserAttributes, "id">
    ) => {
      await UserModel.create({
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId,
        phone: user.phone,
        sessions: user.sessions,
      });
      const users = await UserModel.findAll();
      return users.map((user) => user.dataValues);
    }
  );

  ipcMain.handle(
    "update-user",
    async (
      event: Electron.IpcMainInvokeEvent,
      userAttributes: UserAttributes
    ) => {
      const user = await UserModel.findByPk(userAttributes.id);
      if (!user) {
        throw new Error("کاربر یافت نشد");
      }

      const previous = user.dataValues.sessions;
      const next = userAttributes.sessions;
      const change = next - previous;

      await user.update({
        firstName: userAttributes.firstName,
        lastName: userAttributes.lastName,
        nationalId: userAttributes.nationalId,
        phone: userAttributes.phone,
        sessions: next,
      });

      if (change) {
        let description: string;
        if (change > 0) {
          description = `افزایش ${change
            .toString()
            .replace("-", "")} جلسه توسط منشی`;
        } else {
          description = `کاهش ${change
            .toString()
            .replace("-", "")} جلسه توسط منشی`;
        }
        await SessionLogModel.create({
          userId: userAttributes.id,
          change,
          previousValue: previous,
          newValue: next,
          description,
        });
      }

      const users = await UserModel.findAll();
      return users.map((user) => user.dataValues);
    }
  );

  ipcMain.handle(
    "delete-user",
    async (event: Electron.IpcMainInvokeEvent, userId: number) => {
      await UserModel.destroy({ where: { id: userId } });
      const users = await UserModel.findAll();
      return users.map((user) => user.dataValues);
    }
  );

  ipcMain.handle(
    "decrease-user-sessions",
    async (
      event: Electron.IpcMainInvokeEvent,
      userId: number,
      change: number
    ) => {
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new Error("کاربر یافت نشد");
      }

      const previous = user.dataValues.sessions;
      const next = previous + change;

      await user.update({ sessions: next });

      await SessionLogModel.create({
        userId,
        change,
        previousValue: previous,
        newValue: next,
        description: "مصرف جلسه",
      });
      const users = await UserModel.findAll();
      return users.map((user) => user.dataValues);
    }
  );
}
