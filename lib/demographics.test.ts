import { describe, it, expect } from "vitest";
import {
  AGE_BUCKETS,
  isAgeRange,
  isDemographicsIncomplete,
  normalizeOptionalText,
  toAgeBucket,
} from "./demographics";

describe("toAgeBucket", () => {
  it("keeps a known age range", () => {
    expect(toAgeBucket("25-34")).toBe("25-34");
  });

  it("trims before matching", () => {
    expect(toAgeBucket(" 18-24 ")).toBe("18-24");
  });

  it.each([[""], [null], [undefined], ["17-25"], ["   "]])(
    "buckets %j as UNKNOWN",
    (raw) => {
      expect(toAgeBucket(raw)).toBe("UNKNOWN");
    },
  );
});

describe("AGE_BUCKETS", () => {
  it("lists every age range in order, then UNKNOWN", () => {
    expect(AGE_BUCKETS).toEqual([
      "13-17",
      "18-24",
      "25-34",
      "35-44",
      "45-54",
      "55-64",
      "65+",
      "UNKNOWN",
    ]);
  });
});

describe("isAgeRange", () => {
  it("accepts only exact age range strings", () => {
    expect(isAgeRange("65+")).toBe(true);
    expect(isAgeRange(" 65+")).toBe(false);
    expect(isAgeRange("UNKNOWN")).toBe(false);
    expect(isAgeRange(25)).toBe(false);
  });
});

describe("normalizeOptionalText", () => {
  it("turns blank values into null", () => {
    expect(normalizeOptionalText("")).toBeNull();
    expect(normalizeOptionalText("  ")).toBeNull();
    expect(normalizeOptionalText(null)).toBeNull();
    expect(normalizeOptionalText(undefined)).toBeNull();
  });

  it("trims real values", () => {
    expect(normalizeOptionalText(" Guatemala ")).toBe("Guatemala");
  });
});

describe("isDemographicsIncomplete", () => {
  it.each([
    [{ ageRange: null, country: "Guatemala" }],
    [{ ageRange: "18-24", country: "" }],
    [{ ageRange: "x", country: "Guatemala" }],
    [{ ageRange: "18-24", country: null }],
  ])("is true for %j", (user) => {
    expect(isDemographicsIncomplete(user)).toBe(true);
  });

  it("is false when age range and country are both set", () => {
    expect(isDemographicsIncomplete({ ageRange: "18-24", country: "Guatemala" })).toBe(false);
  });
});
