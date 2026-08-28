import fs from "fs";
import { nativeImage } from "electron";
import {
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  type PhotoKind,
} from "../../shared/photos";
import {
  photoDiskPath,
  photoUrlFor,
  photosDir,
  removePhotoFile,
} from "./photo-files";

export function toPhotoBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  throw new Error("عکس نامعتبر است");
}

export function savePhoto(
  kind: PhotoKind,
  id: number,
  data: unknown
): string {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("شناسه نامعتبر است");
  }
  const buffer = toPhotoBuffer(data);
  if (buffer.length > PHOTO_MAX_BYTES) {
    throw new Error("حجم عکس بیش از ۸ مگابایت است");
  }
  const image = nativeImage.createFromBuffer(buffer);
  if (image.isEmpty()) {
    throw new Error("این فایل عکس معتبر نیست");
  }
  const size = image.getSize();
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(size.width, size.height, 1));
  const resized =
    scale < 1
      ? image.resize({
          width: Math.max(1, Math.round(size.width * scale)),
          height: Math.max(1, Math.round(size.height * scale)),
        })
      : image;
  const jpeg = resized.toJPEG(PHOTO_JPEG_QUALITY);
  fs.mkdirSync(photosDir(), { recursive: true });
  fs.writeFileSync(photoDiskPath(kind, id), jpeg);
  return photoUrlFor(kind, id) ?? "";
}

export function deletePhoto(kind: PhotoKind, id: number) {
  removePhotoFile(kind, id);
}
