import { describe, expect, it } from "vitest";
import {
  fillReminderTemplate,
  formatReminderAmount,
  isAllowedReminderUrl,
  reminderItemKey,
  reminderSmsUrl,
  reminderWhatsAppUrl,
  resolveReminderTemplates,
  toWhatsAppNumber,
} from "./reminders";

describe("reminder templates", () => {
  it("fills placeholders and drops unknown keys", () => {
    const text = fillReminderTemplate("سلام {firstName} {missing} {academy}", {
      firstName: "سارا",
      academy: "هما",
    });
    expect(text).toBe("سلام سارا هما");
  });

  it("falls back to defaults when a template is empty", () => {
    const resolved = resolveReminderTemplates({
      debt: "   ",
      low_credit: "مانده {remaining}",
    });
    expect(resolved.low_credit).toBe("مانده {remaining}");
    expect(resolved.debt).toContain("{debt}");
  });
});

describe("reminder links", () => {
  it("builds WhatsApp and SMS links for Iranian mobiles", () => {
    expect(toWhatsAppNumber("0912-345-6789")).toBe("989123456789");
    expect(reminderWhatsAppUrl("09123456789", "سلام")).toBe(
      "https://wa.me/989123456789?text=%D8%B3%D9%84%D8%A7%D9%85"
    );
    expect(reminderSmsUrl("09123456789", "سلام")).toBe(
      "sms:09123456789?body=%D8%B3%D9%84%D8%A7%D9%85"
    );
    expect(toWhatsAppNumber("123")).toBeNull();
  });

  it("only allows WhatsApp https and sms links", () => {
    expect(isAllowedReminderUrl("https://wa.me/989123456789?text=hi")).toBe(
      true
    );
    expect(isAllowedReminderUrl("sms:09123456789?body=hi")).toBe(true);
    expect(isAllowedReminderUrl("file:///tmp/x")).toBe(false);
    expect(isAllowedReminderUrl("https://evil.example/wa.me")).toBe(false);
  });
});

describe("reminder helpers", () => {
  it("keys items and formats amounts", () => {
    expect(reminderItemKey("debt", 4)).toBe("debt:4:0");
    expect(formatReminderAmount(1200000)).toContain("تومان");
  });
});
