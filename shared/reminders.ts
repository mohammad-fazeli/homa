import { isValidPhone, normalizePhone } from "./validation";
import type { ReminderChannel, ReminderKind } from "./types";

export type { ReminderChannel, ReminderKind };

export const REMINDER_KINDS: ReminderKind[] = [
  "session_tomorrow",
  "low_credit",
  "debt",
];

export const REMINDER_CHANNELS: ReminderChannel[] = [
  "whatsapp",
  "sms",
  "copy",
];

export const LOW_CREDIT_REMINDER_THRESHOLD = 2;

export const REMINDER_KIND_LABELS: Record<ReminderKind, string> = {
  session_tomorrow: "جلسه فردا",
  low_credit: "اعتبار کم",
  debt: "بدهی",
};

export const DEFAULT_REMINDER_TEMPLATES: Record<ReminderKind, string> = {
  session_tomorrow:
    "سلام {firstName} عزیز\nیادآوری جلسهٔ فردا: {weekday} ساعت {time}\n{room}\nآموزشگاه {academy}",
  low_credit:
    "سلام {firstName} عزیز\nاز اعتبار دوره‌تان {remaining} جلسه مانده است. برای تمدید با آموزشگاه هماهنگ کنید.\nآموزشگاه {academy}",
  debt:
    "سلام {firstName} عزیز\nمانده حساب شما {debt} است. لطفاً برای تسویه هماهنگ کنید.\nآموزشگاه {academy}",
};

export const REMINDER_TEMPLATE_HINT =
  "متغیرها: {firstName} {lastName} {name} {phone} {weekday} {date} {time} {room} {instructor} {remaining} {debt} {academy}";

export function isReminderKind(value: string): value is ReminderKind {
  return REMINDER_KINDS.includes(value as ReminderKind);
}

export function isReminderChannel(value: string): value is ReminderChannel {
  return REMINDER_CHANNELS.includes(value as ReminderChannel);
}

export function resolveReminderTemplates(
  partial?: Partial<Record<ReminderKind, string>> | null
): Record<ReminderKind, string> {
  const next = { ...DEFAULT_REMINDER_TEMPLATES };
  for (const kind of REMINDER_KINDS) {
    const value = partial?.[kind]?.trim();
    if (value) next[kind] = value;
  }
  return next;
}

export function fillReminderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toWhatsAppNumber(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return null;
  return `98${normalized.slice(1)}`;
}

export function reminderWhatsAppUrl(
  phone: string,
  text: string
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function reminderSmsUrl(phone: string, text: string): string | null {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return null;
  return `sms:${normalized}?body=${encodeURIComponent(text)}`;
}

export function isAllowedReminderUrl(url: string): boolean {
  const value = url.trim();
  if (/^sms:\+?\d{10,15}(\?|$)/i.test(value)) return true;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname === "wa.me" || parsed.hostname === "api.whatsapp.com"
    );
  } catch {
    return false;
  }
}

export { localDayKey } from "./dates";

export function reminderItemKey(
  kind: ReminderKind,
  userId: number,
  sessionId?: number | null
): string {
  return `${kind}:${userId}:${sessionId ?? 0}`;
}

export function formatReminderAmount(toman: number): string {
  return `${Math.max(0, Math.round(toman)).toLocaleString("fa-IR")} تومان`;
}
