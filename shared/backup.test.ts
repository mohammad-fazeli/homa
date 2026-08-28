import { describe, expect, it } from "vitest";
import { localDayKey } from "./dates";
import {
  AUTO_BACKUP_KEEP_DEFAULT,
  autoBackupFileName,
  autoBackupsToDelete,
  canRunAutoBackup,
  normalizeAutoBackupKeep,
  parseAutoBackupDay,
} from "./backup";

describe("auto backup names", () => {
  it("uses the local calendar day, not UTC ISO", () => {
    const date = new Date(2026, 7, 28, 23, 30, 0);
    expect(autoBackupFileName(localDayKey(date))).toBe(
      "homa-auto-2026-08-28.sqlite"
    );
  });

  it("parses only daily auto files", () => {
    expect(parseAutoBackupDay("homa-auto-2026-08-28.sqlite")).toBe("2026-08-28");
    expect(parseAutoBackupDay("C:\\\\Backups\\\\homa-auto-2026-01-02.sqlite")).toBe(
      "2026-01-02"
    );
    expect(parseAutoBackupDay("homa-backup-2026-08-28.sqlite")).toBeNull();
    expect(parseAutoBackupDay("homa-auto-writing.sqlite")).toBeNull();
  });
});

describe("retention", () => {
  it("keeps the newest files and leaves manual backups alone", () => {
    const names = [
      "homa-backup-2026-08-01.sqlite",
      "homa-auto-2026-08-01.sqlite",
      "homa-auto-2026-08-20.sqlite",
      "homa-auto-2026-08-21.sqlite",
      "notes.txt",
      "homa-auto-2026-08-22.sqlite",
    ];
    expect(autoBackupsToDelete(names, 2)).toEqual([
      "homa-auto-2026-08-01.sqlite",
      "homa-auto-2026-08-20.sqlite",
    ]);
    expect(
      autoBackupsToDelete(
        [...names, "homa-auto-2026-08-01-photos", "homa-auto-2026-08-22-photos"],
        2
      )
    ).toEqual([
      "homa-auto-2026-08-01.sqlite",
      "homa-auto-2026-08-20.sqlite",
      "homa-auto-2026-08-01-photos",
    ]);
    expect(autoBackupsToDelete(names, 14)).toEqual([]);
  });

  it("normalizes keep options", () => {
    expect(normalizeAutoBackupKeep(7)).toBe(7);
    expect(normalizeAutoBackupKeep(30)).toBe(30);
    expect(normalizeAutoBackupKeep(99)).toBe(AUTO_BACKUP_KEEP_DEFAULT);
    expect(normalizeAutoBackupKeep("nope")).toBe(AUTO_BACKUP_KEEP_DEFAULT);
  });
});

describe("canRunAutoBackup", () => {
  it("needs both the switch and a folder", () => {
    expect(canRunAutoBackup(true, "D:\\\\Backups")).toBe(true);
    expect(canRunAutoBackup(true, "  ")).toBe(false);
    expect(canRunAutoBackup(false, "D:\\\\Backups")).toBe(false);
  });
});
