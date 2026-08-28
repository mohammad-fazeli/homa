import { DEFAULT_SLOT_MINUTES, sameTimeSlot } from "./dates";

export type GroupMemberPlanInput = {
  userId: number;
  courseId: number;
  remaining: number;
};

export type ExistingMemberSlot = {
  userId: number;
  date: string | Date;
};

export type PlannedGroupAdd = {
  userId: number;
  courseId: number;
  date: Date;
};

export function parseWeekdays(raw?: string | null): number[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeWeekdays(parsed.map((item) => Number(item)));
  } catch {
    return [];
  }
}

export function normalizeWeekdays(days: number[]): number[] {
  return [...new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
    (a, b) => a - b
  );
}

export function serializeWeekdays(days: number[]): string {
  return JSON.stringify(normalizeWeekdays(days));
}

export function memberHasSlot(
  existing: ExistingMemberSlot[],
  userId: number,
  date: Date,
  slotMinutes = DEFAULT_SLOT_MINUTES
): boolean {
  return existing.some(
    (slot) =>
      slot.userId === userId &&
      sameTimeSlot(new Date(slot.date), date, slotMinutes)
  );
}

export function planGroupSessionAdds(options: {
  dates: Date[];
  members: GroupMemberPlanInput[];
  existingSlots: ExistingMemberSlot[];
  slotMinutes?: number;
}): PlannedGroupAdd[] {
  const slotMinutes = options.slotMinutes ?? DEFAULT_SLOT_MINUTES;
  const remaining = new Map(
    options.members.map((member) => [member.userId, Math.max(0, member.remaining)])
  );
  const adds: PlannedGroupAdd[] = [];

  for (const date of options.dates) {
    for (const member of options.members) {
      const left = remaining.get(member.userId) ?? 0;
      if (left <= 0) continue;
      if (memberHasSlot(options.existingSlots, member.userId, date, slotMinutes)) {
        continue;
      }
      if (
        adds.some(
          (add) =>
            add.userId === member.userId &&
            sameTimeSlot(add.date, date, slotMinutes)
        )
      ) {
        continue;
      }
      adds.push({ userId: member.userId, courseId: member.courseId, date });
      remaining.set(member.userId, left - 1);
    }
  }

  return adds;
}

export function uniquePlanDates(
  adds: PlannedGroupAdd[],
  slotMinutes = DEFAULT_SLOT_MINUTES
): Date[] {
  const seen: Date[] = [];
  for (const add of adds) {
    if (!seen.some((date) => sameTimeSlot(date, add.date, slotMinutes))) {
      seen.push(add.date);
    }
  }
  return seen;
}

export function countAddsAtHour(
  adds: PlannedGroupAdd[],
  date: Date,
  slotMinutes = DEFAULT_SLOT_MINUTES
): number {
  return adds.filter((add) => sameTimeSlot(add.date, date, slotMinutes)).length;
}
