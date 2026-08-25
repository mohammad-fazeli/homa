import fs from "fs";
import { dialog, ipcMain } from "electron";
import { db, getDatabasePath, reopenDatabase, closeDatabase } from "../db";

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
    closeDatabase();
    fs.copyFileSync(source, target);
    for (const suffix of ["-wal", "-shm"]) {
      const extra = source + suffix;
      if (fs.existsSync(extra)) {
        fs.copyFileSync(extra, target + suffix);
      }
    }
    reopenDatabase();
    return { ok: true };
  });
}
