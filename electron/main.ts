import { app, BrowserWindow } from "electron";
import * as path from "path";
import dotenv from "dotenv";
import { registerUserHandlers } from "./ipc/users";
import { sequelize } from "./model";

dotenv.config();

console.log("🚀 ~ process.env.NODE_ENV:", process.env.NODE_ENV);
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }
}

(async () => {
  await sequelize.sync();
})();

app.whenReady().then(() => {
  registerUserHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
