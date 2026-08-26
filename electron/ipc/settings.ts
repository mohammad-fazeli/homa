import { ipcMain } from "electron";
import { readSettings, writeSettings } from "../settings-store";
import type { AppSettings } from "../db/types";
import { hashPin, publicSettings } from "../lib/pin";

export const DEFAULT_TOLERANCE_MINUTES = 20;

export function getAppSettings(): AppSettings {
  const stored = readSettings();
  return {
    rfidPort: stored.rfidPort,
    attendanceToleranceMinutes:
      stored.attendanceToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES,
    lockEnabled: stored.lockEnabled,
    lockPinHash: stored.lockPinHash,
  };
}

function safeSettings() {
  return publicSettings(getAppSettings());
}

export function registerSettingsHandlers() {
  ipcMain.handle("settings:get", () => safeSettings());

  ipcMain.handle("settings:set", (_event, partial: AppSettings) => {
    const { lockPinHash: _ignored, ...rest } = partial;
    writeSettings(rest);
    return safeSettings();
  });

  ipcMain.handle("settings:setPin", (_event, pin: string) => {
    const trimmed = String(pin || "").trim();
    if (trimmed.length < 4) throw new Error("رمز باید حداقل ۴ رقم باشد");
    writeSettings({ lockEnabled: true, lockPinHash: hashPin(trimmed) });
    return safeSettings();
  });

  ipcMain.handle("settings:clearPin", () => {
    writeSettings({ lockEnabled: false, lockPinHash: "" });
    return safeSettings();
  });

  ipcMain.handle("settings:verifyPin", (_event, pin: string) => {
    const stored = getAppSettings();
    if (!stored.lockEnabled || !stored.lockPinHash) return true;
    return hashPin(String(pin || "")) === stored.lockPinHash;
  });
}
