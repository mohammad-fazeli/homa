// src/rfid/serial-rfid.ts

import { SerialPort, SerialPortOpenOptions } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

// -----------------------------
// انواع تایپ‌ها
// -----------------------------

/**
 * گزینه‌های باز کردن پورت سریال
 */
export interface SerialRFIDOpenOptions {
  baudRate?: number;
  newline?: string;
}

/**
 * هندلرهای رویدادها
 */
export type LineCallback = (line: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CloseCallback = () => void;

// -----------------------------
// کلاس اصلی
// -----------------------------

export class SerialRFID {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;

  private _onLine?: LineCallback;
  private _onError?: ErrorCallback;
  private _onClose?: CloseCallback;

  constructor() {}

  /**
   * فهرست کردن پورت‌های قابل استفاده (COM / ttyUSB)
   */
  public static async listPorts() {
    return await SerialPort.list();
  }

  /**
   * باز کردن پورت سریال
   */
  public open(
    path: string,
    options: SerialRFIDOpenOptions = { baudRate: 115200, newline: "\n" }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // اگر پورت باز است اول ببندیم
      if (this.port && this.port.isOpen) {
        this.port.close();
      }

      const portOptions: SerialPortOpenOptions<any> = {
        path,
        baudRate: options.baudRate ?? 115200,
        autoOpen: false,
      };

      this.port = new SerialPort(portOptions);

      // ساخت parser برای خواندن خطی
      this.parser = this.port.pipe(
        new ReadlineParser({ delimiter: options.newline ?? "\n" })
      );

      // تلاش برای باز کردن پورت
      this.port.open((err) => {
        if (err) {
          return reject(err);
        }

        // دریافت دادهٔ خام (اختیاری)
        this.port!.on("data", (data: Buffer) => {
          // اگر لازم داشتید raw bytes را مدیریت کنید
          // console.log("Raw Data:", data);
        });

        // دادهٔ پردازش شده (خطی)
        this.parser!.on("data", (line: string) => {
          if (this._onLine) this._onLine(line);
        });

        // خطاها
        this.port!.on("error", (e: Error) => {
          if (this._onError) this._onError(e);
        });

        // بسته شدن پورت
        this.port!.on("close", () => {
          if (this._onClose) this._onClose();
        });

        resolve();
      });
    });
  }

  /**
   * ثبت رویداد زمانی که یک خط ورودی دریافت شد
   */
  public onLine(cb: LineCallback) {
    this._onLine = cb;
  }

  /**
   * ثبت رویداد خطا
   */
  public onError(cb: ErrorCallback) {
    this._onError = cb;
  }

  /**
   * ثبت رویداد بسته‌شدن پورت
   */
  public onClose(cb: CloseCallback) {
    this._onClose = cb;
  }

  /**
   * ارسال دستور یا متن به ماژول RFID
   */
  public writeLine(line: string): Promise<void> {
    if (!this.port || !this.port.isOpen) {
      throw new Error("Serial port is not open.");
    }

    return new Promise((resolve, reject) => {
      this.port!.write(line + "\n", (err) => {
        if (err) return reject(err);

        this.port!.drain((err2) => {
          if (err2) reject(err2);
          else resolve();
        });
      });
    });
  }

  /**
   * بستن پورت
   */
  public close() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
  }
}

export default SerialRFID;
