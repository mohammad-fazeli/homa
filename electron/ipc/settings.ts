import { ipcMain } from "electron";
import { readSettings, writeSettings } from "../settings-store";
import type { AppSettings } from "../db/types";
import { hashPin, publicSettings } from "../lib/pin";
import { resolveReminderTemplates } from "../../shared/reminders";
import { normalizeAutoBackupKeep } from "../../shared/backup";
import { runAutoBackup } from "../lib/auto-backup";

export const DEFAULT_TOLERANCE_MINUTES = 20;

export function getAppSettings(): AppSettings {
  const stored = readSettings();
  return {
    rfidPort: stored.rfidPort,
    attendanceToleranceMinutes:
      stored.attendanceToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES,
    lockEnabled: stored.lockEnabled,
    lockPinHash: stored.lockPinHash,
    academyName: stored.academyName?.trim() || "هما",
    reminderTemplates: resolveReminderTemplates(stored.reminderTemplates),
    autoBackupEnabled: Boolean(stored.autoBackupEnabled),
    autoBackupFolder: stored.autoBackupFolder?.trim() || "",
    autoBackupKeep: normalizeAutoBackupKeep(stored.autoBackupKeep),
    lastAutoBackupAt: stored.lastAutoBackupAt?.trim() || "",
    lastAutoBackupPath: stored.lastAutoBackupPath?.trim() || "",
    autoBackupError: stored.autoBackupError?.trim() || "",
  };
}

function safeSettings() {
  return publicSettings(getAppSettings());
}

export function registerSettingsHandlers() {
  ipcMain.handle("settings:get", () => safeSettings());

  ipcMain.handle("settings:set", async (_event, partial: AppSettings) => {
    const {
      lockPinHash: _ignored,
      lastAutoBackupAt: _lastAt,
      lastAutoBackupPath: _lastPath,
      autoBackupError: _backupError,
      ...rest
    } = partial;
    if (rest.autoBackupKeep !== undefined) {
      rest.autoBackupKeep = normalizeAutoBackupKeep(rest.autoBackupKeep);
    }
    if (rest.autoBackupFolder !== undefined) {
      rest.autoBackupFolder = rest.autoBackupFolder.trim();
    }
    const merged = { ...readSettings(), ...rest };
    if (merged.autoBackupEnabled && !String(merged.autoBackupFolder || "").trim()) {
      throw new Error("ابتدا پوشه پشتیبان را انتخاب کنید");
    }
    writeSettings(rest);
    if (
      rest.autoBackupEnabled ||
      rest.autoBackupFolder !== undefined ||
      rest.autoBackupKeep !== undefined
    ) {
      await runAutoBackup();
    }
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
