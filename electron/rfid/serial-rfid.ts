import { SerialPort, SerialPortOpenOptions } from "serialport";

export interface SerialRFIDOpenOptions {
  baudRate?: number;
}

export type LineCallback = (line: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CloseCallback = () => void;

export class SerialRFID {
  private port: SerialPort | null = null;
  private buffer = "";
  private path: string | null = null;
  private options: SerialRFIDOpenOptions = {};
  private closing = false;
  private generation = 0;

  private _onLine?: LineCallback;
  private _onError?: ErrorCallback;
  private _onClose?: CloseCallback;

  public isOpen() {
    return Boolean(this.port?.isOpen);
  }

  public getPath() {
    return this.path;
  }

  public static async listPorts() {
    return await SerialPort.list();
  }

  public async open(path: string, options: SerialRFIDOpenOptions = {}) {
    await this.close();
    this.path = path;
    this.options = options;
    await this._openPort();
  }

  private async _openPort(): Promise<void> {
    if (!this.path) throw new Error("Serial port path not set");

    const generation = ++this.generation;
    const portOptions: SerialPortOpenOptions<any> = {
      path: this.path,
      baudRate: this.options.baudRate ?? 9600,
      autoOpen: false,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
    };

    const port = new SerialPort(portOptions);
    this.port = port;
    this.buffer = "";
    this.closing = false;

    return new Promise((resolve, reject) => {
      port.open((err) => {
        if (generation !== this.generation || this.port !== port) {
          try {
            port.close(() => undefined);
          } catch {
            /* already replaced */
          }
          reject(err ?? new Error("Serial port was replaced"));
          return;
        }

        if (err) {
          console.error("Failed to open port:", err);
          this.port = null;
          reject(err);
          return;
        }

        try {
          port.set({ dtr: true });
        } catch {
          /* some adapters reject modem-control flags */
        }

        port.removeAllListeners("data");
        port.removeAllListeners("error");
        port.removeAllListeners("close");
        port.on("data", (data: Buffer) => this._handleData(data));
        port.on("error", (error) => this._handleError(error, port));
        port.on("close", () => this._handleClose(port));
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

  private _handleError(err: Error, port: SerialPort) {
    if (this.closing || this.port !== port) return;
    this._onError?.(err);
    console.error("Serial port error:", err);
  }

  private _handleClose(port: SerialPort) {
    if (this.closing) return;
    if (this.port === port) this.port = null;
    this._onClose?.();
    console.warn("Serial port closed");
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

  /**
   * USB-serial on Windows often stays "open" after unplug until a control
   * call fails. get/flush do not toggle DTR, so Arduino-based readers are not reset.
   */
  public async probe(): Promise<boolean> {
    const port = this.port;
    if (!port?.isOpen) return false;
    if (await this._control(port, "get")) return true;
    return await this._control(port, "flush");
  }

  private _control(port: SerialPort, method: "get" | "flush"): Promise<boolean> {
    return new Promise((resolve) => {
      if (!port.isOpen) {
        resolve(false);
        return;
      }

      const fn = (port as unknown as Record<string, unknown>)[method];
      if (typeof fn !== "function") {
        resolve(true);
        return;
      }

      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      const timer = setTimeout(() => done(Boolean(port.isOpen)), 400);

      try {
        const result = (fn as (cb?: (err: Error | null) => void) => unknown).call(
          port,
          (err: Error | null) => {
            clearTimeout(timer);
            done(!err);
          }
        );
        if (result && typeof (result as Promise<unknown>).then === "function") {
          (result as Promise<unknown>).then(
            () => {
              clearTimeout(timer);
              done(true);
            },
            () => {
              clearTimeout(timer);
              done(false);
            }
          );
        }
      } catch {
        clearTimeout(timer);
        done(false);
      }
    });
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

  public async close(): Promise<void> {
    this.generation += 1;
    this.closing = true;
    const port = this.port;
    this.port = null;
    this.buffer = "";

    if (!port) {
      this.closing = false;
      return;
    }

    port.removeAllListeners("data");
    port.removeAllListeners("error");
    port.removeAllListeners("close");

    if (port.isOpen) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          try {
            port.destroy();
          } catch {
            /* ignore */
          }
          resolve();
        }, 800);
        port.close(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    this.closing = false;
  }
}

export default SerialRFID;
