import { describe, it, expect } from "vitest";
import { generateSerial, prefillRecipientName } from "./certificate";

describe("generateSerial", () => {
  it("formats as DL-<year>-<6 base32 chars>", () => {
    const serial = generateSerial(new Date("2026-06-21T00:00:00Z"));
    expect(serial).toMatch(/^DL-2026-[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it("is unique across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateSerial());
    expect(seen.size).toBe(1000);
  });
});

describe("prefillRecipientName", () => {
  it("uses firstName + lastName when present", () => {
    expect(
      prefillRecipientName({ firstName: "Diego", lastName: "Oliva", name: null, email: "d@x.com" })
    ).toBe("Diego Oliva");
  });

  it("falls back to name, then email local-part", () => {
    expect(prefillRecipientName({ firstName: null, lastName: null, name: "Satoshi", email: "s@x.com" })).toBe("Satoshi");
    expect(prefillRecipientName({ firstName: null, lastName: null, name: null, email: "nakamoto@x.com" })).toBe("nakamoto");
  });

  it("trims and collapses whitespace", () => {
    expect(prefillRecipientName({ firstName: "  Ana ", lastName: " ", name: null, email: "a@x.com" })).toBe("Ana");
  });

  it("falls back to 'Estudiante' when nothing usable is present", () => {
    expect(prefillRecipientName({ firstName: null, lastName: null, name: null, email: "@x.com" })).toBe("Estudiante");
  });
});
