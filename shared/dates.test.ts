import { describe, expect, it } from "vitest";
import {
  buildCalendarSlotTimes,
  sameTimeSlot,
  slotStart,
} from "./dates";

describe("calendar slots", () => {
  it("builds 20-minute rows between 8 and 23", () => {
    const slots = buildCalendarSlotTimes(8, 23, 20);
    expect(slots[0]).toEqual({ hour: 8, minute: 0 });
    expect(slots[1]).toEqual({ hour: 8, minute: 20 });
    expect(slots[2]).toEqual({ hour: 8, minute: 40 });
    expect(slots.at(-1)).toEqual({ hour: 23, minute: 40 });
    expect(slots).toHaveLength(48);
  });

  it("snaps dates to the configured slot", () => {
    const base = new Date(2026, 7, 25, 10, 17, 0);
    expect(slotStart(base, 20).getMinutes()).toBe(0);
    expect(sameTimeSlot(base, new Date(2026, 7, 25, 10, 19, 0), 20)).toBe(true);
    expect(sameTimeSlot(base, new Date(2026, 7, 25, 10, 25, 0), 20)).toBe(false);
  });
});
