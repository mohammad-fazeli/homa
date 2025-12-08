import { BrowserWindow, ipcMain } from "electron";
import SerialRFID from "../rfid/serial-rfid";

const rfid = new SerialRFID();

export async function registerRfidHandlers(win: BrowserWindow) {
  const ports = await SerialRFID.listPorts();
  if (ports.length === 0) return console.error("No RFID port found");
  const port = ports[0].path;

  await rfid.open(port, { baudRate: 9600 });

  // وقتی یک خط کامل از RFID آمد
  rfid.onLine((line) => {
    console.log("RFID LINE:", line);

    // اگر خط UID بود
    if (/^[0-9A-F]{10}$/i.test(line)) {
      win.webContents.send("rfid-card-present", line);
    }

    // کارت برداشته شد
    if (line === "Msg0000005") {
      win.webContents.send("rfid-card-removed");
    }
  });
}
