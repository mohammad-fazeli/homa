import { ipcMain } from "electron";
import { readSettings, writeSettings } from "../settings-store";
import type { AppSettings } from "../db/types";

export const DEFAULT_TOLERANCE_MINUTES = 20;

export function getAppSettings(): AppSettings {
  const stored = readSettings();
  return {
    rfidPort: stored.rfidPort,
    attendanceToleranceMinutes:
      stored.attendanceToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES,
  };
}

export function registerSettingsHandlers() {
  ipcMain.handle("settings:get", (): AppSettings => getAppSettings());

  ipcMain.handle("settings:set", (_event, partial: AppSettings): AppSettings => {
    writeSettings(partial);
    return getAppSettings();
  });
}
