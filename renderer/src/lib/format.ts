import type { SessionStatus } from "../global";

export function formatMoney(value: number) {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < 45 * 1000) return future ? "چند لحظه دیگر" : "همین الان";
  if (abs < hour) {
    const n = Math.max(1, Math.round(abs / minute));
    return future
      ? `${n.toLocaleString("fa-IR")} دقیقه دیگر`
      : `${n.toLocaleString("fa-IR")} دقیقه پیش`;
  }
  if (abs < day) {
    const n = Math.max(1, Math.round(abs / hour));
    return future
      ? `${n.toLocaleString("fa-IR")} ساعت دیگر`
      : `${n.toLocaleString("fa-IR")} ساعت پیش`;
  }
  if (abs < 7 * day) {
    const n = Math.max(1, Math.round(abs / day));
    return future
      ? `${n.toLocaleString("fa-IR")} روز دیگر`
      : `${n.toLocaleString("fa-IR")} روز پیش`;
  }
  return formatDateTime(date);
}

export function formatMonth(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  if (!year || !month) return ym;
  return new Date(year, month - 1, 1).toLocaleDateString("fa-IR", {
    month: "long",
    year: "numeric",
  });
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export function userHue(id: number) {
  return (Math.abs(id) * 47) % 360;
}

export function userColor(id: number) {
  const hues = [166, 28, 205, 328, 92, 18, 232];
  return `hsl(${hues[Math.abs(id) % hues.length]} 42% 36%)`;
}

export function sessionStatusLabel(status?: SessionStatus | string | null) {
  switch (status) {
    case "present":
      return "حاضر";
    case "absent":
      return "غایب";
    case "cancelled":
      return "لغو";
    case "makeup":
      return "جبرانی";
    default:
      return "رزرو";
  }
}
