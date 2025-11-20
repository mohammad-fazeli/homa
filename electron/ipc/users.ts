import { ipcMain } from "electron";
import { UserAttributes, UserModel } from "../model";

export function registerUserHandlers() {
  ipcMain.handle("get-users", async () => {
    const users = await UserModel.findAll();
    return users;
  });

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
      return users;
    }
  );
}
