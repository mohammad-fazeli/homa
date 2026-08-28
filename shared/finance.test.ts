import { describe, expect, it } from "vitest";
import {
  agingBucket,
  appliedAmount,
  cashDelta,
  collectionRate,
  parseToman,
  settleAccount,
  settlementRate,
} from "./finance";

describe("finance", () => {
  it("applies refunds as negative settlement", () => {
    expect(appliedAmount("payment", 1000)).toBe(1000);
    expect(appliedAmount("discount", 200)).toBe(200);
    expect(appliedAmount("refund", 300)).toBe(-300);
  });

  it("keeps discounts out of the cash drawer", () => {
    expect(cashDelta("payment", 1000)).toBe(1000);
    expect(cashDelta("discount", 400)).toBe(0);
    expect(cashDelta("refund", 250)).toBe(-250);
  });

  it("splits debt and credit without going negative", () => {
    expect(settleAccount(800, 300)).toEqual({ debt: 500, credit: 0 });
    expect(settleAccount(800, 900)).toEqual({ debt: 0, credit: 100 });
    expect(settleAccount(800, 800)).toEqual({ debt: 0, credit: 0 });
  });

  it("computes collection and settlement rates", () => {
    expect(collectionRate(250, 1000)).toBe(25);
    expect(settlementRate(800, 1000)).toBe(80);
    expect(collectionRate(10, 0)).toBe(0);
  });

  it("parses Persian digits and separators", () => {
    expect(parseToman("۱٬۲۰۰٬۰۰۰")).toBe(1200000);
    expect(parseToman("250,000")).toBe(250000);
    expect(parseToman("")).toBe(0);
  });

  it("buckets aging ranges", () => {
    expect(agingBucket(0)).toBe("d0");
    expect(agingBucket(31)).toBe("d30");
    expect(agingBucket(90)).toBe("d60");
    expect(agingBucket(91)).toBe("d90");
  });
});
