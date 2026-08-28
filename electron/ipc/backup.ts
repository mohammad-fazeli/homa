import fs from "fs";
import { app, dialog, ipcMain } from "electron";
import { db, getDatabasePath, reopenDatabase, closeDatabase } from "../db";
import { writeSettings, readSettings } from "../settings-store";
import { sqlitePhotosSidecar } from "../../shared/backup";
import { copyPhotosTo, restorePhotosFrom } from "../lib/photo-files";
import {
  getAutoBackupStatus,
  runAutoBackup,
  startAutoBackupScheduler,
  stopAutoBackupScheduler,
} from "../lib/auto-backup";

export function registerBackupHandlers() {
  ipcMain.handle("db:backup", async () => {
    const result = await dialog.showSaveDialog({
      title: "پشتیبان‌گیری از دیتابیس",
      defaultPath: `homa-backup-${new Date().toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
    });
    if (result.canceled || !result.filePath) {
      return { cancelled: true };
    }

    await db.backup(result.filePath);
    copyPhotosTo(sqlitePhotosSidecar(result.filePath));
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle("db:restore", async () => {
    const result = await dialog.showOpenDialog({
      title: "بازیابی دیتابیس",
      filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) {
      return { cancelled: true };
    }

    const source = result.filePaths[0];
    const target = getDatabasePath();
    stopAutoBackupScheduler();
    closeDatabase();
    try {
      fs.copyFileSync(source, target);
      for (const suffix of ["-wal", "-shm"]) {
        const extra = source + suffix;
        if (fs.existsSync(extra)) {
          fs.copyFileSync(extra, target + suffix);
        } else if (fs.existsSync(target + suffix)) {
          fs.unlinkSync(target + suffix);
        }
      }
      reopenDatabase();
      restorePhotosFrom(sqlitePhotosSidecar(source));
      startAutoBackupScheduler();
      return { ok: true };
    } catch (err) {
      try {
        reopenDatabase();
      } catch {
        /* keep the original error */
      }
      startAutoBackupScheduler();
      throw err;
    }
  });

  ipcMain.handle("db:autoBackupStatus", () => getAutoBackupStatus());

  ipcMain.handle("db:chooseBackupFolder", async () => {
    const result = await dialog.showOpenDialog({
      title: "پوشه پشتیبان روزانه",
      defaultPath: app.getPath("documents"),
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || !result.filePaths[0]) {
      return { cancelled: true as const };
    }
    const folder = result.filePaths[0];
    writeSettings({
      autoBackupFolder: folder,
      autoBackupEnabled: true,
      autoBackupError: "",
    });
    const ran = await runAutoBackup();
    return {
      cancelled: false as const,
      folder,
      status: getAutoBackupStatus(),
      ran,
    };
  });

  ipcMain.handle("db:runAutoBackup", async () => {
    if (!readSettings().autoBackupFolder?.trim()) {
      throw new Error("ابتدا پوشه پشتیبان را انتخاب کنید");
    }
    return runAutoBackup({ force: true });
  });
}
