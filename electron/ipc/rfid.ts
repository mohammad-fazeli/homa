import { BrowserWindow } from "electron";
import SerialRFID from "../rfid/serial-rfid";

export const rfid = new SerialRFID();

export let rfidConnect: "online" | "offline" = "offline";

let handlersBound = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let targetWindow: BrowserWindow | null = null;

function sendToWindow(channel: string, ...args: unknown[]) {
  const win = targetWindow;
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, ...args);
}

function pickRfidPort(
  ports: Awaited<ReturnType<typeof SerialRFID.listPorts>>
) {
  const preferred = process.env.RFID_PORT?.trim();
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

export async function registerRfidHandlers(win: BrowserWindow) {
  targetWindow = win;

  const sendStatus = (status: "online" | "offline") => {
    rfidConnect = status;
    sendToWindow("rfid:status", status);
  };

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

  const connect = async () => {
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
  };

  if (retryTimer) clearTimeout(retryTimer);
  await connect();
}
