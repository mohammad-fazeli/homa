import { toEnglishDigits } from "./dates";
import type {
  DebtAgingBucket,
  PaymentKind,
  PaymentMethod,
} from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "card",
  "transfer",
  "check",
  "online",
];

export const PAYMENT_KINDS: PaymentKind[] = ["payment", "refund", "discount"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "نقد",
  card: "کارتخوان",
  transfer: "کارت‌به‌کارت",
  check: "چک",
  online: "آنلاین",
};

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  payment: "دریافت",
  refund: "استرداد",
  discount: "تخفیف",
};

export const DEBT_AGING_LABELS: Record<DebtAgingBucket, string> = {
  d0: "تا ۳۰ روز",
  d30: "۳۰ تا ۶۰ روز",
  d60: "۶۰ تا ۹۰ روز",
  d90: "بیش از ۹۰ روز",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

export function isPaymentKind(value: string): value is PaymentKind {
  return PAYMENT_KINDS.includes(value as PaymentKind);
}

/** How much this row changes the remaining contract balance. */
export function appliedAmount(kind: PaymentKind | string | null | undefined, amount: number) {
  return (kind === "refund" ? -1 : 1) * Math.abs(amount);
}

/** Cash that actually entered or left the drawer. */
export function cashDelta(kind: PaymentKind | string | null | undefined, amount: number) {
  if (kind === "refund") return -Math.abs(amount);
  if (kind === "discount") return 0;
  return Math.abs(amount);
}

export function settleAccount(contracted: number, applied: number) {
  const debt = Math.max(0, Math.round(contracted - applied));
  const credit = Math.max(0, Math.round(applied - contracted));
  return { debt, credit };
}

export function collectionRate(collected: number, contracted: number) {
  if (contracted <= 0) return 0;
  return Math.round((Math.max(0, collected) / contracted) * 1000) / 10;
}

export function settlementRate(applied: number, contracted: number) {
  if (contracted <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, applied) / contracted) * 1000) / 10);
}

export function parseToman(input: string | number | null | undefined) {
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.trunc(input) : 0;
  }
  const cleaned = toEnglishDigits(String(input ?? "")).replace(/[^\d-]/g, "");
  if (!cleaned || cleaned === "-") return 0;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

export function agingBucket(days: number): DebtAgingBucket {
  if (days <= 30) return "d0";
  if (days <= 60) return "d30";
  if (days <= 90) return "d60";
  return "d90";
}

export function daysBetween(from: Date | string, to: Date = new Date()) {
  const start = from instanceof Date ? from : new Date(from);
  if (Number.isNaN(start.getTime())) return 0;
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((b - a) / 86400000);
}

export function appliedSql(alias = "") {
  const kind = alias ? `${alias}.kind` : "kind";
  const amount = alias ? `${alias}.amount` : "amount";
  return `CASE WHEN IFNULL(${kind}, 'payment') = 'refund' THEN -${amount} ELSE ${amount} END`;
}

export function cashInSql(alias = "") {
  const kind = alias ? `${alias}.kind` : "kind";
  const amount = alias ? `${alias}.amount` : "amount";
  return `CASE WHEN IFNULL(${kind}, 'payment') = 'payment' THEN ${amount} ELSE 0 END`;
}

export function refundSql(alias = "") {
  const kind = alias ? `${alias}.kind` : "kind";
  const amount = alias ? `${alias}.amount` : "amount";
  return `CASE WHEN IFNULL(${kind}, 'payment') = 'refund' THEN ${amount} ELSE 0 END`;
}

export function discountSql(alias = "") {
  const kind = alias ? `${alias}.kind` : "kind";
  const amount = alias ? `${alias}.amount` : "amount";
  return `CASE WHEN IFNULL(${kind}, 'payment') = 'discount' THEN ${amount} ELSE 0 END`;
}
