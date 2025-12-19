import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import dotenv from "dotenv";
import { registerUserHandlers } from "./ipc/users";
import { initDatabase } from "./db";
import { registerRfidHandlers } from "./ipc/rfid";
import { registerCalendarHandlers } from "./ipc/calendar";
import { registerBillingHandlers } from "./ipc/billing";
import { registerDashboardHandlers } from "./ipc/dashboard";

dotenv.config();

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "./../renderer/dist/index.html"));
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });

    win.removeMenu();
    win.webContents.openDevTools();

    win.webContents.on("before-input-event", (event, input) => {
      if (
        !isDev &&
        input.control &&
        input.shift &&
        input.key.toLowerCase() === "i"
      ) {
        event.preventDefault();
      }
    });
  }

  ipcMain.on("window:minimize", () => win.minimize());
  ipcMain.on("window:maximize", () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("window:close", () => win.close());
  registerRfidHandlers(win);
}

app.whenReady().then(() => {
  registerUserHandlers();
  registerCalendarHandlers();
  registerBillingHandlers();
  registerDashboardHandlers();
  createWindow();
  initDatabase();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
