import type { SessionStatus } from "./types";

export const SESSION_STATUSES: SessionStatus[] = [
  "scheduled",
  "present",
  "absent",
  "cancelled",
  "makeup",
];

export function normalizeStatus(
  status?: string | null,
  used?: 0 | 1
): SessionStatus {
  if (status === "present" || status === "absent" || status === "cancelled" || status === "makeup" || status === "scheduled") {
    return status;
  }
  return used === 1 ? "present" : "scheduled";
}

export function usedFromStatus(status: SessionStatus): 0 | 1 {
  return status === "present" || status === "absent" || status === "makeup" ? 1 : 0;
}

export function occupiesSlot(status?: string | null, used?: 0 | 1): boolean {
  return normalizeStatus(status, used) !== "cancelled";
}

export function consumesCredit(status?: string | null, used?: 0 | 1): boolean {
  const normalized = normalizeStatus(status, used);
  return (
    normalized === "present" ||
    normalized === "absent" ||
    normalized === "makeup"
  );
}
