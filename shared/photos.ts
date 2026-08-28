export const PHOTO_KINDS = ["user", "instructor"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export const PHOTO_SCHEME = "homa-photo";
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 512;
export const PHOTO_JPEG_QUALITY = 82;

export function isPhotoKind(value: string): value is PhotoKind {
  return (PHOTO_KINDS as readonly string[]).includes(value);
}

export function photoFileName(kind: PhotoKind, id: number): string {
  return `${kind}-${id}.jpg`;
}

export function photoDisplayUrl(
  kind: PhotoKind,
  id: number,
  version: number
): string {
  return `${PHOTO_SCHEME}://${kind}/${id}?v=${Math.max(0, Math.trunc(version))}`;
}

export function parsePhotoRequestUrl(
  url: string
): { kind: PhotoKind; id: number } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${PHOTO_SCHEME}:`) return null;
    if (!isPhotoKind(parsed.hostname)) return null;
    const idPart = parsed.pathname.replace(/^\//, "").split("/")[0] ?? "";
    const id = Number(idPart);
    if (!Number.isInteger(id) || id <= 0) return null;
    return { kind: parsed.hostname, id };
  } catch {
    return null;
  }
}
