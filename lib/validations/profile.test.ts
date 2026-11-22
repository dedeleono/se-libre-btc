import { describe, it, expect } from "vitest";
import { getRegionsForCountry } from "../constants/countries";
import { parseProfileUpdate } from "./profile";

describe("dataset", () => {
  it("knows Quetzaltenango as a region of Guatemala", () => {
    expect(getRegionsForCountry("Guatemala")).toContain("Quetzaltenango");
  });
});

describe("parseProfileUpdate", () => {
  it("accepts the onboarding payload and renames imageUrl to image", () => {
    expect(
      parseProfileUpdate({
        name: "Ana",
        ageRange: "18-24",
        country: "Guatemala",
        region: "Quetzaltenango",
        imageUrl: "https://x/y.png",
        onboardingCompleted: true,
      }),
    ).toEqual({
      ok: true,
      data: {
        name: "Ana",
        image: "https://x/y.png",
        onboardingCompleted: true,
        ageRange: "18-24",
        country: "Guatemala",
        region: "Quetzaltenango",
      },
    });
  });

  it("turns empty strings from the profile form into null", () => {
    expect(
      parseProfileUpdate({ name: "Ana", phone: "", ageRange: "", country: "", region: "" }),
    ).toEqual({
      ok: true,
      data: { name: "Ana", phone: null, ageRange: null, country: null, region: null },
    });
  });

  it("drops keys it does not model", () => {
    expect(parseProfileUpdate({ name: "Ana", role: "ADMIN", email: "a@b.c" })).toEqual({
      ok: true,
      data: { name: "Ana" },
    });
  });

  it("rejects an unknown age range", () => {
    expect(parseProfileUpdate({ ageRange: "17-25" })).toEqual({
      ok: false,
      fieldErrors: { ageRange: ["INVALID_AGE_RANGE"] },
    });
  });

  it("rejects an unknown country", () => {
    expect(parseProfileUpdate({ country: "Narnia" })).toEqual({
      ok: false,
      fieldErrors: { country: ["INVALID_COUNTRY"] },
    });
  });

  it("rejects a region from another country", () => {
    expect(parseProfileUpdate({ country: "Guatemala", region: "California" })).toEqual({
      ok: false,
      fieldErrors: { region: ["INVALID_REGION"] },
    });
  });

  it("rejects a region sent without its country", () => {
    expect(parseProfileUpdate({ region: "Quetzaltenango" })).toEqual({
      ok: false,
      fieldErrors: { region: ["INVALID_REGION"] },
    });
  });

  it("rejects a region when the country is cleared", () => {
    expect(parseProfileUpdate({ country: "", region: "Quetzaltenango" })).toEqual({
      ok: false,
      fieldErrors: { region: ["INVALID_REGION"] },
    });
  });

  it("treats an empty payload as no change", () => {
    expect(parseProfileUpdate({})).toEqual({ ok: true, data: {} });
  });

  it.each([[null], [[]], ["name=Ana"], [42]])("rejects the non-object body %j", (body) => {
    expect(parseProfileUpdate(body)).toEqual({
      ok: false,
      fieldErrors: { body: ["INVALID_BODY"] },
    });
  });

  it("rejects a blank name", () => {
    const result = parseProfileUpdate({ name: "   " });
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.fieldErrors.name).toHaveLength(1);
  });

  it("trims the name", () => {
    expect(parseProfileUpdate({ name: "  Ana  " })).toEqual({ ok: true, data: { name: "Ana" } });
  });

  it("rejects an age range of the wrong type", () => {
    const result = parseProfileUpdate({ ageRange: 25 });
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.fieldErrors.ageRange).toHaveLength(1);
  });

  it("rejects onboardingCompleted that is not a boolean", () => {
    const result = parseProfileUpdate({ onboardingCompleted: "true" });
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.fieldErrors.onboardingCompleted).toHaveLength(1);
  });

  it("accepts a null image to remove the photo", () => {
    expect(parseProfileUpdate({ imageUrl: null })).toEqual({ ok: true, data: { image: null } });
  });

  it("accepts a regionless country and nulls an empty region", () => {
    expect(parseProfileUpdate({ country: "Aruba", region: "" })).toEqual({
      ok: true,
      data: { country: "Aruba", region: null },
    });
  });

  it("rejects a named region for a regionless country", () => {
    expect(parseProfileUpdate({ country: "Aruba", region: "Oranjestad" })).toEqual({
      ok: false,
      fieldErrors: { region: ["INVALID_REGION"] },
    });
  });
});

describe("parseProfileUpdate phone", () => {
  it.each([
    ["+502 5555-1234", "+50255551234"],
    ["(555) 123-4567", "5551234567"],
    ["  5555 1234  ", "55551234"],
  ])("stores %j as %j", (phone, stored) => {
    expect(parseProfileUpdate({ phone })).toEqual({ ok: true, data: { phone: stored } });
  });

  it.each([[""], ["   "], [null]])("stores %j as null", (phone) => {
    expect(parseProfileUpdate({ phone })).toEqual({ ok: true, data: { phone: null } });
  });

  it.each([["555"], ["call me maybe"], ["+502 5555 1234 ext 9"], ["-------"], ["1".repeat(21)], [5555555]])(
    "rejects %j",
    (phone) => {
      expect(parseProfileUpdate({ phone })).toEqual({
        ok: false,
        fieldErrors: { phone: ["INVALID_PHONE"] },
      });
    },
  );
});
