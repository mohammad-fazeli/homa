import { localDayKey } from "./dates";

export const AUTO_BACKUP_KEEP_DEFAULT = 14;
export const AUTO_BACKUP_KEEP_OPTIONS = [7, 14, 30] as const;
export const AUTO_BACKUP_FILE_RE = /^homa-auto-(\d{4}-\d{2}-\d{2})\.sqlite$/i;

export function normalizeAutoBackupKeep(value: unknown): number {
  const parsed = Math.trunc(Number(value));
  if ((AUTO_BACKUP_KEEP_OPTIONS as readonly number[]).includes(parsed)) {
    return parsed;
  }
  return AUTO_BACKUP_KEEP_DEFAULT;
}

export function autoBackupFileName(dayKey = localDayKey()): string {
  return `homa-auto-${dayKey}.sqlite`;
}

export function parseAutoBackupDay(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop() ?? "";
  const match = AUTO_BACKUP_FILE_RE.exec(base);
  return match?.[1] ?? null;
}

export function parseAutoBackupArtifact(fileName: string): string | null {
  const fromSqlite = parseAutoBackupDay(fileName);
  if (fromSqlite) return fromSqlite;
  const base = fileName.split(/[/\\]/).pop() ?? "";
  const match = /^homa-auto-(\d{4}-\d{2}-\d{2})-photos$/i.exec(base);
  return match?.[1] ?? null;
}

export function autoBackupPhotosDirName(dayKey = localDayKey()): string {
  return `homa-auto-${dayKey}-photos`;
}

export function sqlitePhotosSidecar(sqlitePath: string): string {
  return sqlitePath.replace(/\.(sqlite|db)$/i, "") + "-photos";
}

export function autoBackupsToDelete(fileNames: string[], keep: number): string[] {
  const keepCount = Math.max(1, Math.trunc(keep) || AUTO_BACKUP_KEEP_DEFAULT);
  const tagged = fileNames
    .map((name) => ({ name, day: parseAutoBackupArtifact(name) }))
    .filter((item): item is { name: string; day: string } => Boolean(item.day));
  const days = [...new Set(tagged.map((item) => item.day))].sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0
  );
  const keepDays = new Set(days.slice(0, keepCount));
  return tagged.filter((item) => !keepDays.has(item.day)).map((item) => item.name);
}

export function canRunAutoBackup(
  enabled: boolean,
  folder: string | null | undefined
): boolean {
  return Boolean(enabled && String(folder ?? "").trim());
}
