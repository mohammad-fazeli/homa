import { SerialPort, SerialPortOpenOptions } from "serialport";

export interface SerialRFIDOpenOptions {
  baudRate?: number;
  reconnectDelay?: number;
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
  private stopped = false;

  public isOpen() {
    return Boolean(this.port?.isOpen);
  }

  public static async listPorts() {
    return await SerialPort.list();
  }

  public async open(path: string, options: SerialRFIDOpenOptions = {}) {
    this.stopped = false;
    this.path = path;
    this.options = options;
    await this._openPort();
  }

  private async _openPort(): Promise<void> {
    if (!this.path) throw new Error("Serial port path not set");

    if (this.port?.isOpen) {
      await new Promise<void>((resolve) => {
        this.port!.close(() => resolve());
      });
    }

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

    return new Promise((resolve, reject) => {
      this.port!.open((err) => {
        if (err) {
          console.error("Failed to open port:", err);
          this._scheduleReconnect();
          reject(err);
          return;
        }

        try {
          this.port!.set({ dtr: true });
        } catch {}

        this.port!.removeAllListeners("data");
        this.port!.removeAllListeners("error");
        this.port!.removeAllListeners("close");
        this.port!.on("data", (data: Buffer) => this._handleData(data));
        this.port!.on("error", (err) => this._handleError(err));
        this.port!.on("close", () => this._handleClose());
        this._onReconnect?.("online");
        console.log("RFID connected to", this.path);
        resolve();
      });
    });
  }

  private _handleData(data: Buffer) {
    const text = data.toString("utf8");
    this.buffer += text;

    let line: string | null;
    while ((line = this._extractLine()) !== null) {
      this._onLine?.(line);
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
    this._onError?.(err);
    console.error("Serial port error:", err);
    this._scheduleReconnect();
  }

  private _handleClose() {
    this._onClose?.();
    console.warn("Serial port closed");
    this._scheduleReconnect();
  }

  private _scheduleReconnect() {
    if (this.stopped || this.reconnecting) return;
    this.reconnecting = true;

    const delay = this.options.reconnectDelay ?? 1500;
    console.log(`Reconnecting RFID in ${delay}ms...`);

    setTimeout(async () => {
      this.reconnecting = false;
      if (this.stopped) return;

      try {
        const ports = await SerialRFID.listPorts();
        const found = ports.find((p) => p.path === this.path);
        if (!found) {
          this._onReconnect?.("offline");
          this._scheduleReconnect();
          return;
        }

        await this._openPort();
      } catch (e) {
        console.error("RFID reconnect failed:", e);
        this._onReconnect?.("offline");
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
    this.stopped = true;
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.port = null;
  }
}

export default SerialRFID;
