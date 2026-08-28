import { BrowserWindow, ipcMain } from "electron";
import SerialRFID from "../rfid/serial-rfid";
import {
  findListedPort,
  isLiveRfidConnection,
  pickRfidPort,
  preferredRfidPath,
  usbIdentityLost,
  type ListedPort,
} from "../rfid/port-select";
import { readSettings, writeSettings } from "../settings-store";
import type { RfidPortInfo } from "../db/types";

export const rfid = new SerialRFID();

export let rfidConnect: "online" | "offline" = "offline";

const HEALTH_MS = 2000;
const RETRY_MS = 2500;

let handlersBound = false;
let ipcBound = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let targetWindow: BrowserWindow | null = null;
let connectPromise: Promise<void> | null = null;
let dropping = false;
let probeEverWorked = false;
let openedPort: ListedPort | null = null;
let loadHooked = new WeakSet<BrowserWindow>();

function sendToWindow(channel: string, ...args: unknown[]) {
  const win = targetWindow;
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, ...args);
}

function sendStatus(status: "online" | "offline", force = false) {
  if (!force && rfidConnect === status) return;
  rfidConnect = status;
  sendToWindow("rfid:status", status);
}

function preferredPath() {
  return preferredRfidPath(
    readSettings().rfidPort,
    process.env.RFID_PORT
  );
}

function stopTimers() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}

function startHealth() {
  if (healthTimer) return;
  healthTimer = setInterval(() => {
    void healthTick();
  }, HEALTH_MS);
}

function scheduleRetry() {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void connect();
  }, RETRY_MS);
}

async function listedPorts() {
  return await SerialRFID.listPorts();
}

async function verifyLive(): Promise<boolean> {
  if (!rfid.isOpen()) return false;
  const path = rfid.getPath();
  if (!path) return false;

  const ports = await listedPorts();
  const current = findListedPort(ports, path);
  if (!current || !isLiveRfidConnection(true, path, ports)) return false;
  if (usbIdentityLost(openedPort, current)) return false;

  const probeOk = await rfid.probe();
  if (probeOk) {
    probeEverWorked = true;
    return true;
  }

  // Some adapters reject modem-status/flush even while connected.
  // Only treat a failed probe as unplug after it has succeeded once on this handle.
  return !probeEverWorked;
}

async function markOfflineAndRetry() {
  if (dropping) return;
  dropping = true;
  probeEverWorked = false;
  openedPort = null;
  try {
    sendStatus("offline");
    try {
      await rfid.close();
    } catch (err) {
      console.error("RFID close failed:", err);
    }
    scheduleRetry();
  } finally {
    dropping = false;
  }
}

async function connectOnce() {
  if (await verifyLive()) {
    sendStatus("online");
    startHealth();
    return;
  }

  if (rfid.isOpen()) {
    try {
      await rfid.close();
    } catch {
      /* continue to a fresh open */
    }
  }

  const ports = await listedPorts();
  const port = pickRfidPort(ports, preferredPath());

  if (!port?.path) {
    sendStatus("offline");
    scheduleRetry();
    return;
  }

  try {
    await rfid.open(port.path, { baudRate: 9600 });
    probeEverWorked = false;
    const stillListed = await listedPorts();
    openedPort = findListedPort(stillListed, rfid.getPath()) ?? port;
    if (
      !isLiveRfidConnection(rfid.isOpen(), rfid.getPath(), stillListed)
    ) {
      await markOfflineAndRetry();
      return;
    }
    sendStatus("online");
    startHealth();
  } catch {
    sendStatus("offline");
    try {
      await rfid.close();
    } catch {
      /* already closed */
    }
    scheduleRetry();
  }
}

async function connect() {
  if (connectPromise) return connectPromise;
  connectPromise = connectOnce().finally(() => {
    connectPromise = null;
  });
  return connectPromise;
}

async function healthTick() {
  if (connectPromise) return;
  if (await verifyLive()) {
    sendStatus("online");
    return;
  }
  await markOfflineAndRetry();
}

async function onLost() {
  if (connectPromise) return;
  await markOfflineAndRetry();
}

export async function reconnectRfid(path?: string) {
  if (path !== undefined) {
    writeSettings({ rfidPort: path.trim() });
  }
  stopTimers();
  sendStatus("offline");
  try {
    await rfid.close();
  } catch (err) {
    console.error("RFID close failed:", err);
  }
  await connect();
}

export function stopRfid() {
  stopTimers();
  rfidConnect = "offline";
  probeEverWorked = false;
  openedPort = null;
  void rfid.close();
}

export function registerRfidIpc() {
  if (ipcBound) return;
  ipcBound = true;

  ipcMain.handle("check-device", async () => {
    if (!rfid.isOpen()) {
      if (rfidConnect === "online") {
        sendStatus("offline");
        scheduleRetry();
      }
      return "offline";
    }
    return rfidConnect;
  });

  ipcMain.handle("rfid:listPorts", async (): Promise<RfidPortInfo[]> => {
    const ports = await listedPorts();
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
    }));
  });

  ipcMain.handle("rfid:getPort", () => readSettings().rfidPort ?? "");

  ipcMain.handle("rfid:setPort", async (_event, portPath: string) => {
    await reconnectRfid(String(portPath ?? ""));
    return { ok: true, status: rfidConnect };
  });
}

export async function registerRfidHandlers(win: BrowserWindow) {
  targetWindow = win;

  if (!loadHooked.has(win)) {
    loadHooked.add(win);
    win.webContents.on("did-finish-load", () => {
      sendToWindow("rfid:status", rfidConnect);
    });
  }

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

    rfid.onError(() => {
      void onLost();
    });
    rfid.onClose(() => {
      void onLost();
    });
  }

  stopTimers();
  await connect();
  sendStatus(rfidConnect, true);
}
