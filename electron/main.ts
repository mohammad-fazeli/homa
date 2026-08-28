import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import dotenv from "dotenv";
import { registerUserHandlers } from "./ipc/users";
import { closeDatabase, initDatabase } from "./db";
import { registerRfidHandlers, registerRfidIpc, stopRfid } from "./ipc/rfid";
import { registerCalendarHandlers } from "./ipc/calendar";
import { registerBillingHandlers } from "./ipc/billing";
import { registerDashboardHandlers } from "./ipc/dashboard";
import { registerBackupHandlers } from "./ipc/backup";
import { startAutoBackupScheduler, stopAutoBackupScheduler } from "./lib/auto-backup";
import { registerSettingsHandlers } from "./ipc/settings";
import { registerAcademyHandlers } from "./ipc/academy";
import { registerReminderHandlers } from "./ipc/reminders";
import { registerImportHandlers } from "./ipc/import-customers";
import { registerPhotoHandlers } from "./ipc/photos";
import { registerPhotoScheme, registerPhotoProtocol } from "./lib/photo-protocol";

registerPhotoScheme();
app.setAppUserModelId("com.homa.studentmanager");
dotenv.config({ path: path.join(app.getPath("userData"), ".env") });
dotenv.config();

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let windowHandlersRegistered = false;

function getMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function registerWindowHandlers() {
  if (windowHandlersRegistered) return;
  windowHandlersRegistered = true;

  ipcMain.on("window:minimize", () => getMainWindow()?.minimize());
  ipcMain.on("window:maximize", () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window:close", () => getMainWindow()?.close());
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    frame: false,
    show: false,
    title: "هما",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });

  const win = mainWindow;

  win.once("ready-to-show", () => win.show());

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(app.getAppPath(), "renderer", "dist", "index.html"));
    win.removeMenu();
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });
    win.webContents.on("before-input-event", (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        event.preventDefault();
      }
    });
  }

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  registerRfidHandlers(win);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  app.whenReady().then(() => {
    try {
      initDatabase();
    } catch (err) {
      dialog.showErrorBox(
        "هما",
        err instanceof Error
          ? `باز کردن پایگاه داده ممکن نشد.\n${err.message}`
          : "باز کردن پایگاه داده ممکن نشد."
      );
      app.quit();
      return;
    }
    registerWindowHandlers();
    registerUserHandlers();
    registerCalendarHandlers();
    registerBillingHandlers();
    registerDashboardHandlers();
    registerRfidIpc();
    registerBackupHandlers();
    registerSettingsHandlers();
    registerAcademyHandlers();
    registerReminderHandlers();
    registerImportHandlers();
    registerPhotoHandlers();
    registerPhotoProtocol();
    startAutoBackupScheduler();
    createWindow();
  });
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopRfid();
  stopAutoBackupScheduler();
  closeDatabase();
});
