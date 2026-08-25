import { sameHour } from "../../shared/dates";

export type RfidSession = {
  id: number;
  date: string | Date;
  used: 0 | 1;
};

export type RfidMatch =
  | { status: "none" }
  | { status: "ok"; session: RfidSession }
  | { status: "already_used"; session: RfidSession }
  | { status: "out_of_tolerance"; session: RfidSession };

export function resolveRfidSession(
  sessions: RfidSession[],
  now = new Date(),
  options?: { force?: boolean; sessionId?: number; toleranceMinutes?: number }
): RfidMatch {
  if (!sessions.length) return { status: "none" };

  if (options?.sessionId) {
    const forced = sessions.find((s) => s.id === options.sessionId);
    if (!forced) return { status: "none" };
    if (forced.used === 1) return { status: "already_used", session: forced };
    return { status: "ok", session: forced };
  }

  const toleranceMs = (options?.toleranceMinutes ?? 20) * 60 * 1000;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;
  const nowTs = now.getTime();

  const today = sessions
    .map((session) => ({ session, ts: new Date(session.date).getTime() }))
    .filter(({ ts }) => !Number.isNaN(ts) && ts >= startOfToday && ts < endOfToday)
    .sort((a, b) => a.ts - b.ts);

  if (today.length === 0) return { status: "none" };

  const inTolerance = today.filter(
    ({ ts }) => ts >= nowTs - toleranceMs && ts <= nowTs + toleranceMs
  );

  const unusedInTolerance = inTolerance.find(({ session }) => session.used === 0);
  if (unusedInTolerance) return { status: "ok", session: unusedInTolerance.session };

  const usedInTolerance = inTolerance.find(({ session }) => session.used === 1);
  if (usedInTolerance && inTolerance.length && !today.some((t) => t.session.used === 0)) {
    return { status: "already_used", session: usedInTolerance.session };
  }

  const unusedToday = today.find(({ session }) => session.used === 0);
  if (unusedToday) {
    if (options?.force) return { status: "ok", session: unusedToday.session };
    return { status: "out_of_tolerance", session: unusedToday.session };
  }

  return { status: "already_used", session: today[0].session };
}

export function hasHourConflict(
  existing: Array<{ id: number; date: string | Date }>,
  candidate: string | Date,
  excludeIds: number[] = []
): boolean {
  const target = new Date(candidate);
  if (Number.isNaN(target.getTime())) return false;
  return existing.some(
    (item) =>
      !excludeIds.includes(item.id) && sameHour(new Date(item.date), target)
  );
}
