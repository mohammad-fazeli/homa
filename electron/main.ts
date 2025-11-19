import { app, BrowserWindow } from "electron";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

console.log("🚀 ~ process.env.NODE_ENV:", process.env.NODE_ENV);
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    // حالت dev → vite dev server
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    // حالت build → فایل واقعی
    win.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
