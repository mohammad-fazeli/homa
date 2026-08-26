import { describe, expect, it } from "vitest";
import { isValidNationalId, isValidPhone } from "../../shared/validation";
import { parseFlexibleDate, sameHour } from "../../shared/dates";
import { resolveRfidSession, hasHourConflict } from "./session-match";

describe("validation", () => {
  it("accepts a valid mobile number", () => {
    expect(isValidPhone("09123456789")).toBe(true);
  });

  it("rejects short phones", () => {
    expect(isValidPhone("0912")).toBe(false);
  });

  it("validates national id checksum", () => {
    expect(isValidNationalId("0000000000")).toBe(false);
    expect(isValidNationalId("1111111111")).toBe(false);
    expect(isValidNationalId("123")).toBe(false);
  });
});

describe("dates", () => {
  it("parses ISO dates", () => {
    const d = parseFlexibleDate("2026-08-25T06:30:00.000Z");
    expect(d).toBeInstanceOf(Date);
  });

  it("detects the same local hour", () => {
    const a = new Date(2026, 7, 25, 10, 0, 0);
    const b = new Date(2026, 7, 25, 10, 45, 0);
    expect(sameHour(a, b)).toBe(true);
  });
});

describe("rfid session match", () => {
  const now = new Date(2026, 7, 25, 10, 5, 0);
  const sessions = [
    { id: 1, date: new Date(2026, 7, 25, 10, 0, 0).toISOString(), used: 0 as const },
    { id: 2, date: new Date(2026, 7, 25, 18, 0, 0).toISOString(), used: 0 as const },
  ];

  it("matches a session inside tolerance", () => {
    const match = resolveRfidSession(sessions, now);
    expect(match.status).toBe("ok");
    if (match.status === "ok") expect(match.session.id).toBe(1);
  });

  it("asks for confirmation outside tolerance", () => {
    const evening = new Date(2026, 7, 25, 12, 0, 0);
    const match = resolveRfidSession(sessions, evening);
    expect(match.status).toBe("out_of_tolerance");
  });

  it("forces the pending session", () => {
    const evening = new Date(2026, 7, 25, 12, 0, 0);
    const match = resolveRfidSession(sessions, evening, { force: true, sessionId: 2 });
    expect(match.status).toBe("ok");
    if (match.status === "ok") expect(match.session.id).toBe(2);
  });

  it("respects a custom tolerance window", () => {
    const later = new Date(2026, 7, 25, 10, 40, 0);
    const tight = resolveRfidSession(sessions, later, { toleranceMinutes: 10 });
    expect(tight.status).toBe("out_of_tolerance");
    const wide = resolveRfidSession(sessions, later, { toleranceMinutes: 60 });
    expect(wide.status).toBe("ok");
  });
});

describe("hour conflict", () => {
  it("detects overlapping hours", () => {
    const existing = [
      { id: 1, date: new Date(2026, 7, 25, 10, 0, 0).toISOString() },
    ];
    expect(
      hasHourConflict(existing, new Date(2026, 7, 25, 10, 15, 0), [])
    ).toBe(true);
    expect(
      hasHourConflict(existing, new Date(2026, 7, 25, 11, 0, 0), [])
    ).toBe(false);
  });
});
