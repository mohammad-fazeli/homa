import { ipcMain } from "electron";
import { isPhotoKind, type PhotoKind } from "../../shared/photos";
import { deletePhoto, savePhoto } from "../lib/photos";
import { photoUrlFor } from "../lib/photo-files";

export function registerPhotoHandlers() {
  ipcMain.handle(
    "photos:save",
    (_event, kind: PhotoKind, id: number, data: unknown) => {
      if (!isPhotoKind(kind)) throw new Error("نوع عکس نامعتبر است");
      const url = savePhoto(kind, id, data);
      return { ok: true, photoUrl: url };
    }
  );

  ipcMain.handle("photos:remove", (_event, kind: PhotoKind, id: number) => {
    if (!isPhotoKind(kind)) throw new Error("نوع عکس نامعتبر است");
    deletePhoto(kind, id);
    return { ok: true, photoUrl: photoUrlFor(kind, id) };
  });
}
