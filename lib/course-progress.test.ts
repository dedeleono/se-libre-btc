import { describe, it, expect } from "vitest";
import { progressPercent } from "./course-progress";

describe("progressPercent", () => {
  it("is 0 when the course has no published chapters", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it("is 0 when no chapter is completed", () => {
    expect(progressPercent(0, 4)).toBe(0);
  });

  it("is the completed share as a percentage", () => {
    expect(progressPercent(1, 4)).toBe(25);
  });

  it("does not round", () => {
    expect(progressPercent(1, 3)).toBeCloseTo(100 / 3);
  });

  it("is 100 when every chapter is completed", () => {
    expect(progressPercent(4, 4)).toBe(100);
  });
});
