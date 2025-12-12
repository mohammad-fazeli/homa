import { ipcMain } from "electron";
import { SessionModel } from "../db/models/SessionModel";
import { SessionResult } from "../db/types";

export function registerCalendarHandlers() {
  ipcMain.handle(
    "get-calender",
    async (
      event,
      start: string | Date,
      end: string | Date
    ): Promise<SessionResult[]> => {
      return await SessionModel.findAll(start, end);
    }
  );
}
