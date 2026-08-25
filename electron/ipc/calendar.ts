import { ipcMain } from "electron";
import { SessionModel } from "../db/models/SessionModel";
import { SessionResult } from "../db/types";

function getSessions(
  start: string | Date,
  end: string | Date
): SessionResult[] {
  return SessionModel.findAll(start, end);
}

export function registerCalendarHandlers() {
  ipcMain.handle(
    "get-calendar",
    (_event, start: string | Date, end: string | Date) =>
      getSessions(start, end)
  );
  ipcMain.handle(
    "get-calender",
    (_event, start: string | Date, end: string | Date) =>
      getSessions(start, end)
  );
}
