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
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("window:close", () => getMainWindow()?.close());
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 640,
    frame: false,
    show: false,
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
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
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

app.whenReady().then(() => {
  initDatabase();
  registerWindowHandlers();
  registerUserHandlers();
  registerCalendarHandlers();
  registerBillingHandlers();
  registerDashboardHandlers();
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
