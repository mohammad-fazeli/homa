import { ipcMain, shell } from "electron";
import { ReminderModel } from "../db/models/ReminderModel";
import {
  isAllowedReminderUrl,
  reminderSmsUrl,
  reminderWhatsAppUrl,
} from "../../shared/reminders";
import type { ReminderChannel, ReminderMarkSentInput } from "../db/types";

export function registerReminderHandlers() {
  ipcMain.handle("reminders:snapshot", () => ReminderModel.snapshot());
  ipcMain.handle("reminders:counts", () => ReminderModel.counts());
  ipcMain.handle("reminders:markSent", (_event, input: ReminderMarkSentInput) =>
    ReminderModel.markSent(input)
  );
  ipcMain.handle(
    "reminders:open",
    async (
      _event,
      payload: { channel: ReminderChannel; phone: string; message: string }
    ) => {
      const url =
        payload.channel === "sms"
          ? reminderSmsUrl(payload.phone, payload.message)
          : reminderWhatsAppUrl(payload.phone, payload.message);
      if (!url || !isAllowedReminderUrl(url)) {
        throw new Error("شماره تلفن برای ارسال پیام معتبر نیست");
      }
      await shell.openExternal(url);
      return { ok: true };
    }
  );
}
