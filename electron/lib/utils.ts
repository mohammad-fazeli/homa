export function startOfWeekSaturday(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 1) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function mapSqliteError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("UNIQUE constraint failed")) {
    if (message.includes("phone")) {
      throw new Error("این شماره تلفن قبلاً ثبت شده است");
    }
    if (message.includes("nationalId")) {
      throw new Error("این کد ملی قبلاً ثبت شده است");
    }
    if (message.includes("uidCart")) {
      throw new Error("این کارت قبلاً برای کاربر دیگری ثبت شده است");
    }
    throw new Error("اطلاعات واردشده تکراری است");
  }

  throw err instanceof Error ? err : new Error(message);
}
