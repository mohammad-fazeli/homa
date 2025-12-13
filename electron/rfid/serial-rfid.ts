// src/rfid/serial-rfid.ts

import { SerialPort, SerialPortOpenOptions } from "serialport";

export interface SerialRFIDOpenOptions {
  baudRate?: number;
  reconnectDelay?: number; // میلی‌ثانیه تا تلاش بعدی برای reconnect
}

export type LineCallback = (line: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CloseCallback = () => void;
export type OnReconnect = (status: "online" | "offline") => void;

export class SerialRFID {
  private port: SerialPort | null = null;
  private buffer = "";

  private _onLine?: LineCallback;
  private _onError?: ErrorCallback;
  private _onClose?: CloseCallback;
  private _onReconnect?: OnReconnect;

  private path: string | null = null;
  private options: SerialRFIDOpenOptions = {};
  private reconnecting = false;

  constructor() {}

  public static async listPorts() {
    return await SerialPort.list();
  }

  // باز کردن پورت و فعال کردن auto-reconnect
  public async open(path: string, options: SerialRFIDOpenOptions = {}) {
    this.path = path;
    this.options = options;

    await this._openPort();
  }

  private async _openPort(): Promise<void> {
    if (!this.path) throw new Error("Serial port path not set");

    const portOptions: SerialPortOpenOptions<any> = {
      path: this.path,
      baudRate: this.options.baudRate ?? 9600,
      autoOpen: false,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      lock: false,
    };

    this.port = new SerialPort(portOptions);

    this.port.open((err) => {
      if (err) {
        console.error("❌ Failed to open port:", err);
        this._scheduleReconnect();
        return;
      }

      try {
        this.port!.set({ dtr: true });
      } catch {}

      this.port!.on("data", (data: Buffer) => this._handleData(data));
      this.port!.on("error", (err) => this._handleError(err));
      this.port!.on("close", () => this._handleClose());
      if (this._onReconnect) this._onReconnect("online");
      console.log("✅ RFID connected to", this.path);
    });
  }

  private _handleData(data: Buffer) {
    const text = data.toString("utf8");
    this.buffer += text;

    let line;
    while ((line = this._extractLine()) !== null) {
      if (this._onLine) this._onLine(line);
    }
  }

  private _extractLine(): string | null {
    const rn = this.buffer.indexOf("\r\n");
    if (rn >= 0) {
      const line = this.buffer.slice(0, rn);
      this.buffer = this.buffer.slice(rn + 2);
      return line.trim();
    }

    const r = this.buffer.indexOf("\r");
    if (r >= 0) {
      const line = this.buffer.slice(0, r);
      this.buffer = this.buffer.slice(r + 1);
      return line.trim();
    }

    const n = this.buffer.indexOf("\n");
    if (n >= 0) {
      const line = this.buffer.slice(0, n);
      this.buffer = this.buffer.slice(n + 1);
      return line.trim();
    }

    return null;
  }

  private _handleError(err: Error) {
    if (this._onError) this._onError(err);
    console.error("⚠ Serial port error:", err);
    this._scheduleReconnect();
  }

  private _handleClose() {
    if (this._onClose) this._onClose?.();
    console.warn("⚠ Serial port closed");
    this._scheduleReconnect();
  }

  private _scheduleReconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    const delay = this.options.reconnectDelay ?? 1500;
    console.log(`⏱ Reconnecting in ${delay}ms...`);

    setTimeout(async () => {
      this.reconnecting = false;

      try {
        // بررسی اینکه COM هنوز وصل است
        const ports = await SerialRFID.listPorts();
        const found = ports.find((p) => p.path === this.path);
        if (!found) {
          console.warn("⚠ Device not found, waiting for next retry");
          this._scheduleReconnect();
          return;
        }

        console.log("🔄 Reconnecting to", this.path);
        await this._openPort();
      } catch (e) {
        console.error("❌ Reconnect failed:", e);
        if (this._onReconnect) this._onReconnect("offline");
        this._scheduleReconnect();
      }
    }, delay);
  }

  public onLine(cb: LineCallback) {
    this._onLine = cb;
  }

  public onError(cb: ErrorCallback) {
    this._onError = cb;
  }

  public onClose(cb: CloseCallback) {
    this._onClose = cb;
  }

  public onReconnect(cb: OnReconnect) {
    this._onReconnect = cb;
  }

  public writeLine(line: string): Promise<void> {
    if (!this.port || !this.port.isOpen) {
      throw new Error("Serial port is not open.");
    }

    return new Promise((resolve, reject) => {
      this.port!.write(line + "\r\n", (err) => {
        if (err) return reject(err);
        this.port!.drain((err2) => (err2 ? reject(err2) : resolve()));
      });
    });
  }

  public close() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.port = null;
  }
}

export default SerialRFID;
