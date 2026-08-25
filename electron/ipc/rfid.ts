import { BrowserWindow, ipcMain } from "electron";
import SerialRFID from "../rfid/serial-rfid";
import { readSettings, writeSettings } from "../settings-store";
import type { RfidPortInfo } from "../db/types";

export const rfid = new SerialRFID();

export let rfidConnect: "online" | "offline" = "offline";

let handlersBound = false;
let ipcBound = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let targetWindow: BrowserWindow | null = null;

function sendToWindow(channel: string, ...args: unknown[]) {
  const win = targetWindow;
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, ...args);
}

function sendStatus(status: "online" | "offline") {
  rfidConnect = status;
  sendToWindow("rfid:status", status);
}

function pickRfidPort(
  ports: Awaited<ReturnType<typeof SerialRFID.listPorts>>
) {
  const saved = readSettings().rfidPort?.trim();
  const preferred = saved || process.env.RFID_PORT?.trim();
  if (preferred) {
    return ports.find((p) => p.path === preferred) ?? { path: preferred };
  }

  const usable = ports.filter((p) => {
    const haystack =
      `${p.pnpId ?? ""} ${p.path ?? ""} ${p.manufacturer ?? ""}`.toUpperCase();
    return !haystack.includes("BTHENUM") && !haystack.includes("BLUETOOTH");
  });

  return usable[0] ?? ports[0];
}

async function connect() {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  if (rfid.isOpen()) {
    sendStatus("online");
    return;
  }

  const ports = await SerialRFID.listPorts();
  const port = pickRfidPort(ports);

  if (!port?.path) {
    sendStatus("offline");
    retryTimer = setTimeout(connect, 3000);
    return;
  }

  try {
    await rfid.open(port.path, { baudRate: 9600, reconnectDelay: 1500 });
    sendStatus("online");
  } catch {
    sendStatus("offline");
  }
}

export async function reconnectRfid(path?: string) {
  if (path) writeSettings({ rfidPort: path });
  rfid.close();
  if (retryTimer) clearTimeout(retryTimer);
  await connect();
}

export function registerRfidIpc() {
  if (ipcBound) return;
  ipcBound = true;

  ipcMain.handle("check-device", () => rfidConnect);

  ipcMain.handle("rfid:listPorts", async (): Promise<RfidPortInfo[]> => {
    const ports = await SerialRFID.listPorts();
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
    }));
  });

  ipcMain.handle("rfid:getPort", () => readSettings().rfidPort ?? "");

  ipcMain.handle("rfid:setPort", async (_event, portPath: string) => {
    await reconnectRfid(portPath);
    return { ok: true, status: rfidConnect };
  });
}

export async function registerRfidHandlers(win: BrowserWindow) {
  targetWindow = win;

  if (!handlersBound) {
    handlersBound = true;

    rfid.onLine((line) => {
      if (/^[0-9A-F]{10}$/i.test(line)) {
        sendToWindow("rfid-card-present", line);
      }
      if (line === "Msg0000005") {
        sendToWindow("rfid-card-removed");
      }
    });

    rfid.onReconnect((status) => sendStatus(status));
    rfid.onError(() => sendStatus("offline"));
    rfid.onClose(() => sendStatus("offline"));
  }

  if (retryTimer) clearTimeout(retryTimer);
  await connect();
}
