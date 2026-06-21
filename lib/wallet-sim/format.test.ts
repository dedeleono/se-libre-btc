import { describe, it, expect } from "vitest";
import { satsToBtc, formatSats, formatBtc, truncateAddress } from "./format";

describe("format", () => {
  it("converts sats to BTC without float drift", () => {
    expect(satsToBtc(100_000_000)).toBe(1);
    expect(satsToBtc(1_000_000)).toBe(0.01);
    expect(satsToBtc(546)).toBeCloseTo(0.00000546, 8);
  });

  it("formats sats as a grouped integer (es locale groups with .)", () => {
    expect(formatSats(1_000_000, "es-ES")).toMatch(/1[.\s ]000[.\s ]000/);
  });

  it("formats BTC to 8 decimal places", () => {
    expect(formatBtc(100_000_000, "en-US")).toBe("1.00000000");
    expect(formatBtc(1_000_000, "en-US")).toBe("0.01000000");
  });

  it("truncates an address to head…tail", () => {
    const a = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
    const t = truncateAddress(a);
    expect(t.startsWith("tb1q")).toBe(true);
    expect(t).toContain("…");
    expect(t.length).toBeLessThan(a.length);
  });
});
