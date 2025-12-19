// src/electron/handlers/rfidHandlers.ts
import { BrowserWindow } from "electron";
import SerialRFID from "../rfid/serial-rfid";

export const rfid = new SerialRFID();

export let rfidConnect: "online" | "offline" = "offline";

export async function registerRfidHandlers(win: BrowserWindow) {
  const sendStatus = (status: "online" | "offline") => {
    win.webContents.send("rfid:status", status);
  };

  const ports = await SerialRFID.listPorts();

  if (ports.length === 0) {
    sendStatus("offline");
    rfidConnect = "offline";
    console.error("❌ No RFID device found");
    return;
  }

  const port = ports[0].path;

  try {
    await rfid.open(port, { baudRate: 9600, reconnectDelay: 1500 });
    sendStatus("online");
    rfidConnect = "online";
  } catch (e) {
    sendStatus("offline");
    rfidConnect = "offline";
    return;
  }

  // ==========================
  // RFID EVENTS
  // ==========================
  rfid.onLine((line) => {
    console.log("RFID LINE:", line);

    if (/^[0-9A-F]{10}$/i.test(line)) {
      win.webContents.send("rfid-card-present", line);
    }

    if (line === "Msg0000005") {
      win.webContents.send("rfid-card-removed");
    }
  });

  rfid.onReconnect((status) => {
    sendStatus(status);
  });

  rfid.onError(() => {
    sendStatus("offline");
  });

  rfid.onClose(() => {
    sendStatus("offline");
  });

  setTimeout(() => {
    sendStatus("online");
  }, 2000);
}
