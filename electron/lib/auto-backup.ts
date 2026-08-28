import fs from "fs";
import path from "path";
import { db, getDatabasePath, isDatabaseOpen } from "../db";
import { readSettings, writeSettings } from "../settings-store";
import type { AutoBackupRunResult, AutoBackupStatus } from "../../shared/types";
import {
  autoBackupFileName,
  autoBackupPhotosDirName,
  autoBackupsToDelete,
  canRunAutoBackup,
  normalizeAutoBackupKeep,
} from "../../shared/backup";
import { localDayKey } from "../../shared/dates";
import { copyPhotosTo } from "./photo-files";

const WRITING_NAME = "homa-auto-writing.sqlite";
const INTERVAL_MS = 60 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

export function getAutoBackupStatus(): AutoBackupStatus {
  const stored = readSettings();
  const folder = stored.autoBackupFolder?.trim() || "";
  return {
    enabled: Boolean(stored.autoBackupEnabled),
    folder,
    folderMissing: folder ? !isWritableDirectory(folder) : false,
    keep: normalizeAutoBackupKeep(stored.autoBackupKeep),
    lastAt: stored.lastAutoBackupAt?.trim() || "",
    lastPath: stored.lastAutoBackupPath?.trim() || "",
    lastError: stored.autoBackupError?.trim() || "",
  };
}

export async function runAutoBackup(
  options: { force?: boolean } = {}
): Promise<AutoBackupRunResult> {
  if (running) return { ok: true, skipped: true };
  running = true;
  try {
    const stored = readSettings();
    const folder = stored.autoBackupFolder?.trim() || "";
    const enabled = Boolean(stored.autoBackupEnabled) || Boolean(options.force);
    if (!canRunAutoBackup(enabled, folder)) {
      return { ok: true, skipped: true };
    }
    if (!isWritableDirectory(folder)) {
      const error = "پوشهٔ پشتیبان پیدا نشد یا قابل نوشتن نیست";
      writeSettings({ autoBackupError: error });
      return { ok: false, error };
    }

    const dest = path.join(folder, autoBackupFileName(localDayKey()));
    const live = path.resolve(getDatabasePath());
    if (path.resolve(dest) === live) {
      const error = "پوشهٔ پشتیبان نمی‌تواند همان فایل پایگاه داده باشد";
      writeSettings({ autoBackupError: error });
      return { ok: false, error };
    }

    if (!isDatabaseOpen()) {
      return { ok: true, skipped: true };
    }

    const tmp = path.join(folder, WRITING_NAME);
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    await db.backup(tmp);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(tmp, dest);

    const photosDest = path.join(folder, autoBackupPhotosDirName(localDayKey()));
    if (fs.existsSync(photosDest)) {
      fs.rmSync(photosDest, { recursive: true, force: true });
    }
    copyPhotosTo(photosDest);

    pruneAutoBackups(folder, normalizeAutoBackupKeep(stored.autoBackupKeep));
    writeSettings({
      lastAutoBackupAt: new Date().toISOString(),
      lastAutoBackupPath: dest,
      autoBackupError: "",
    });
    return { ok: true, path: dest };
  } catch (err) {
    const error = err instanceof Error ? err.message : "پشتیبان روزانه ناموفق بود";
    writeSettings({ autoBackupError: error });
    return { ok: false, error };
  } finally {
    running = false;
  }
}

export function startAutoBackupScheduler() {
  stopAutoBackupScheduler();
  void runAutoBackup();
  timer = setInterval(() => {
    void runAutoBackup();
  }, INTERVAL_MS);
  timer.unref?.();
}

export function stopAutoBackupScheduler() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

function pruneAutoBackups(folder: string, keep: number) {
  let names: string[] = [];
  try {
    names = fs.readdirSync(folder);
  } catch {
    return;
  }
  for (const name of autoBackupsToDelete(names, keep)) {
    const full = path.join(folder, name);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
      else fs.unlinkSync(full);
    } catch {
      /* keep going */
    }
  }
}

function isWritableDirectory(folder: string): boolean {
  try {
    return fs.statSync(folder).isDirectory();
  } catch {
    return false;
  }
}
