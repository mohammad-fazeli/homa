import { sameHour } from "./dates";

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
  date: Date
): boolean {
  return existing.some(
    (slot) => slot.userId === userId && sameHour(new Date(slot.date), date)
  );
}

export function planGroupSessionAdds(options: {
  dates: Date[];
  members: GroupMemberPlanInput[];
  existingSlots: ExistingMemberSlot[];
}): PlannedGroupAdd[] {
  const remaining = new Map(
    options.members.map((member) => [member.userId, Math.max(0, member.remaining)])
  );
  const adds: PlannedGroupAdd[] = [];

  for (const date of options.dates) {
    for (const member of options.members) {
      const left = remaining.get(member.userId) ?? 0;
      if (left <= 0) continue;
      if (memberHasSlot(options.existingSlots, member.userId, date)) continue;
      if (adds.some((add) => add.userId === member.userId && sameHour(add.date, date))) {
        continue;
      }
      adds.push({ userId: member.userId, courseId: member.courseId, date });
      remaining.set(member.userId, left - 1);
    }
  }

  return adds;
}

export function uniquePlanDates(adds: PlannedGroupAdd[]): Date[] {
  const seen: Date[] = [];
  for (const add of adds) {
    if (!seen.some((date) => sameHour(date, add.date))) seen.push(add.date);
  }
  return seen;
}

export function countAddsAtHour(adds: PlannedGroupAdd[], date: Date): number {
  return adds.filter((add) => sameHour(add.date, date)).length;
}
