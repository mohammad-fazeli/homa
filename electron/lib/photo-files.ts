import fs from "fs";
import os from "os";
import path from "path";
import { databasePath } from "../db/connection";
import {
  photoDisplayUrl,
  photoFileName,
  type PhotoKind,
} from "../../shared/photos";

export function photosDir() {
  if (!databasePath || databasePath === ":memory:") {
    return path.join(os.tmpdir(), "homa-photos-memory");
  }
  return path.join(path.dirname(databasePath), "photos");
}

export function photoDiskPath(kind: PhotoKind, id: number) {
  return path.join(photosDir(), photoFileName(kind, id));
}

export function absolutePhotoPath(kind: PhotoKind, id: number): string | null {
  const file = photoDiskPath(kind, id);
  return fs.existsSync(file) ? file : null;
}

export function photoUrlFor(kind: PhotoKind, id: number): string | null {
  const file = absolutePhotoPath(kind, id);
  if (!file) return null;
  try {
    const version = Math.trunc(fs.statSync(file).mtimeMs);
    return photoDisplayUrl(kind, id, version);
  } catch {
    return null;
  }
}

export function removePhotoFile(kind: PhotoKind, id: number) {
  const file = photoDiskPath(kind, id);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function copyPhotosTo(destDir: string) {
  const src = photosDir();
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, destDir, { recursive: true });
}

export function restorePhotosFrom(srcDir: string) {
  if (!fs.existsSync(srcDir)) return;
  const dest = photosDir();
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(srcDir, dest, { recursive: true });
}
