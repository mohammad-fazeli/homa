import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import dotenv from "dotenv";
import { registerUserHandlers } from "./ipc/users";
import { SerialRFID } from "./rfid/serial-rfid";
import { initDatabase } from "./db";

dotenv.config();

console.log("🚀 ~ process.env.NODE_ENV:", process.env.NODE_ENV);
const isDev = process.env.NODE_ENV === "development";

const rfid = new SerialRFID();

// --- RFID SETUP ---
(async () => {
  const ports = await SerialRFID.listPorts();
  console.log("🔌 Available RFID Ports:", ports);

  // انتخاب پورت — این را با توجه به سیستم خودت اصلاح کن
  const selectedPort = ports[0]?.path; // مثلا "/dev/ttyUSB0" یا "COM3"
  if (!selectedPort) {
    console.error("❌ No serial port found for RFID!");
    return;
  }

  try {
    await rfid.open(selectedPort, { baudRate: 9600, newline: "\n" });
    // console.log("✅ RFID Reader connected on:", selectedPort);

    let lastUID: string | null = null;
    let cardPresent = false;

    rfid.onLine((line) => {
      console.log("📡 RAW:", line);

      // 1) پیام وضعیت → مثل Msg0000005
      if (line.startsWith("Msg")) {
        // کارت برداشته شد
        if (line === "Msg0000005" && cardPresent) {
          console.log("🟥 Card removed");
          lastUID = null;
          cardPresent = false;
        }

        return; // هیچ کار دیگری نکن
      }

      // 2) UID واقعی کارت → 10 کاراکتر HEX
      if (/^[0-9A-F]{10}$/i.test(line)) {
        if (!cardPresent || line !== lastUID) {
          console.log("🟩 Card UID:", line);
          lastUID = line;
          cardPresent = true;
        }
      }
    });

    rfid.onError((err) => {
      console.error("❗ RFID ERROR:", err);
    });

    rfid.onClose(() => {
      console.log("🔌 RFID port closed");
    });
  } catch (err) {
    console.error("❌ Failed to open RFID:", err);
  }
})();

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
}

app.whenReady().then(async () => {
  registerUserHandlers();
  createWindow();
  await initDatabase();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
