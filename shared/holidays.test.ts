import { describe, expect, it } from "vitest";
import { generateRecurringDates } from "./dates";
import {
  closedDayMessage,
  dayKeyFromValue,
  holidayConflict,
  isClosedDay,
  normalizeClosedWeekdays,
  parseDayKey,
} from "./holidays";

describe("parseDayKey", () => {
  it("accepts a real local calendar day", () => {
    expect(parseDayKey("2026-08-28")).toBe("2026-08-28");
    expect(parseDayKey("۲۰۲۶-۰۸-۲۸")).toBe("2026-08-28");
  });

  it("rejects impossible dates", () => {
    expect(parseDayKey("2026-02-30")).toBeNull();
    expect(parseDayKey("2026-13-01")).toBeNull();
    expect(parseDayKey("not-a-date")).toBeNull();
  });
});

describe("holidayConflict", () => {
  const friday = new Date(2026, 7, 28, 16, 0, 0); // جمعه
  const saturday = new Date(2026, 7, 29, 16, 0, 0);

  it("marks a weekly closed weekday", () => {
    const hit = holidayConflict(friday, [], [6]);
    expect(hit?.reason).toBe("weekday");
    expect(hit?.title).toBe("جمعه");
    expect(closedDayMessage(hit!)).toContain("جمعه");
    expect(isClosedDay(saturday, [], [6])).toBe(false);
  });

  it("marks a named holiday over the weekday rule", () => {
    const hit = holidayConflict(friday, [{ dayKey: "2026-08-28", title: "نوروز" }], [6]);
    expect(hit?.reason).toBe("holiday");
    expect(hit?.title).toBe("نوروز");
    expect(closedDayMessage(hit!)).toContain("نوروز");
  });

  it("uses the local day of an ISO session timestamp", () => {
    expect(dayKeyFromValue(friday.toISOString())).toBe("2026-08-28");
    expect(holidayConflict(friday.toISOString(), [], [6])?.reason).toBe("weekday");
  });
});

describe("normalizeClosedWeekdays", () => {
  it("keeps unique Saturday-first indexes", () => {
    expect(normalizeClosedWeekdays([6, 6, 0, 9, "2"])).toEqual([0, 2, 6]);
    expect(normalizeClosedWeekdays("friday")).toEqual([]);
  });
});

describe("generateRecurringDates skip", () => {
  it("skips a closed Saturday and still fills the count", () => {
    const start = new Date(2026, 7, 29, 9, 0, 0);
    const dates = generateRecurringDates({
      startDate: start,
      weekdays: [0],
      hour: 16,
      count: 2,
      skipDate: (date) => date.getDate() === 29 && date.getMonth() === 7,
    });
    expect(dates).toHaveLength(2);
    expect(dates[0].getDate()).toBe(5);
    expect(dates[0].getMonth()).toBe(8);
    expect(dates[1].getDate()).toBe(12);
  });
});
