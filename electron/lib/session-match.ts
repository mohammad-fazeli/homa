import { sameHour } from "../../shared/dates";
import { occupiesSlot } from "../../shared/session";

export type RfidSession = {
  id: number;
  date: string | Date;
  used: 0 | 1;
  status?: string | null;
};

export type OccupancySession = {
  id: number;
  date: string | Date;
  roomId?: number | null;
  instructorId?: number | null;
  status?: string | null;
  used?: 0 | 1;
};

export type RfidMatch =
  | { status: "none" }
  | { status: "ok"; session: RfidSession }
  | { status: "already_used"; session: RfidSession }
  | { status: "out_of_tolerance"; session: RfidSession };

function isOpenSession(session: RfidSession) {
  return session.used === 0 && session.status !== "cancelled";
}

export function resolveRfidSession(
  sessions: RfidSession[],
  now = new Date(),
  options?: { force?: boolean; sessionId?: number; toleranceMinutes?: number }
): RfidMatch {
  if (!sessions.length) return { status: "none" };

  if (options?.sessionId) {
    const forced = sessions.find((s) => s.id === options.sessionId);
    if (!forced) return { status: "none" };
    if (!isOpenSession(forced)) return { status: "already_used", session: forced };
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
    .filter(
      ({ ts, session }) =>
        !Number.isNaN(ts) &&
        ts >= startOfToday &&
        ts < endOfToday &&
        session.status !== "cancelled"
    )
    .sort((a, b) => a.ts - b.ts);

  if (today.length === 0) return { status: "none" };

  const inTolerance = today.filter(
    ({ ts }) => ts >= nowTs - toleranceMs && ts <= nowTs + toleranceMs
  );

  const unusedInTolerance = inTolerance.find(({ session }) =>
    isOpenSession(session)
  );
  if (unusedInTolerance) return { status: "ok", session: unusedInTolerance.session };

  const usedInTolerance = inTolerance.find(({ session }) => session.used === 1);
  if (
    usedInTolerance &&
    inTolerance.length &&
    !today.some((item) => isOpenSession(item.session))
  ) {
    return { status: "already_used", session: usedInTolerance.session };
  }

  const unusedToday = today.find(({ session }) => isOpenSession(session));
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

export function countRoomOccupancy(
  existing: OccupancySession[],
  candidate: string | Date,
  roomId: number | null | undefined,
  excludeIds: number[] = []
): number {
  if (!roomId) return 0;
  const target = new Date(candidate);
  if (Number.isNaN(target.getTime())) return 0;
  return existing.filter(
    (item) =>
      !excludeIds.includes(item.id) &&
      item.roomId === roomId &&
      occupiesSlot(item.status, item.used) &&
      sameHour(new Date(item.date), target)
  ).length;
}

export function isInstructorBusy(
  existing: OccupancySession[],
  candidate: string | Date,
  instructorId: number | null | undefined,
  excludeIds: number[] = []
): boolean {
  if (!instructorId) return false;
  const target = new Date(candidate);
  if (Number.isNaN(target.getTime())) return false;
  return existing.some(
    (item) =>
      !excludeIds.includes(item.id) &&
      item.instructorId === instructorId &&
      occupiesSlot(item.status, item.used) &&
      sameHour(new Date(item.date), target)
  );
}
