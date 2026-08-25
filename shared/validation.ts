import { toEnglishDigits } from "./dates";

export function isValidPhone(phone: string): boolean {
  const value = toEnglishDigits(phone).replace(/[\s-]/g, "");
  return /^09\d{9}$/.test(value);
}

export function isValidNationalId(nationalId: string): boolean {
  const id = toEnglishDigits(nationalId).trim();
  if (!/^\d{10}$/.test(id)) return false;
  if (/^(\d)\1{9}$/.test(id)) return false;

  const check = Number(id[9]);
  const sum = id
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

export function normalizePhone(phone: string): string {
  return toEnglishDigits(phone).replace(/[\s-]/g, "");
}

export function normalizeNationalId(nationalId: string): string {
  return toEnglishDigits(nationalId).trim();
}
