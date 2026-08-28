import { describe, expect, it } from "vitest";
import { generateRecurringDates } from "./dates";
import {
  countAddsAtHour,
  parseWeekdays,
  planGroupSessionAdds,
  serializeWeekdays,
} from "./groups";

describe("weekdays", () => {
  it("round-trips and sorts unique days", () => {
    expect(serializeWeekdays([2, 0, 0, 9])).toBe("[0,2]");
    expect(parseWeekdays("[0,2]")).toEqual([0, 2]);
    expect(parseWeekdays("not-json")).toEqual([]);
  });
});

describe("recurring dates", () => {
  it("fills Saturday slots from a Wednesday start", () => {
    const start = new Date(2026, 7, 26, 9, 0, 0); // Wednesday
    const dates = generateRecurringDates({
      startDate: start,
      weekdays: [0],
      hour: 16,
      count: 2,
    });
    expect(dates).toHaveLength(2);
    expect(dates[0].getDay()).toBe(6);
    expect(dates[0].getHours()).toBe(16);
    expect(dates[1].getTime() - dates[0].getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("planGroupSessionAdds", () => {
  const sat = new Date(2026, 7, 29, 16, 0, 0);
  const nextSat = new Date(2026, 8, 5, 16, 0, 0);

  it("creates the same hour for every member with remaining credit", () => {
    const adds = planGroupSessionAdds({
      dates: [sat, nextSat],
      members: [
        { userId: 1, courseId: 10, remaining: 2 },
        { userId: 2, courseId: 11, remaining: 1 },
      ],
      existingSlots: [],
    });
    expect(adds).toHaveLength(3);
    expect(countAddsAtHour(adds, sat)).toBe(2);
    expect(countAddsAtHour(adds, nextSat)).toBe(1);
  });

  it("skips a member who already has that hour", () => {
    const adds = planGroupSessionAdds({
      dates: [sat],
      members: [
        { userId: 1, courseId: 10, remaining: 2 },
        { userId: 2, courseId: 11, remaining: 2 },
      ],
      existingSlots: [{ userId: 1, date: sat.toISOString() }],
    });
    expect(adds).toHaveLength(1);
    expect(adds[0].userId).toBe(2);
  });
});
