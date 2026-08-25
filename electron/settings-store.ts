import fs from "fs";
import path from "path";
import { app } from "electron";
import type { AppSettings } from "./db/types";

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

export function readSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf8");
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

export function writeSettings(partial: AppSettings): AppSettings {
  const next = { ...readSettings(), ...partial };
  fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}
