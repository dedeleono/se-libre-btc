import { describe, expect, it } from "vitest";

import { getCourseLearningHref } from "./course-navigation";

describe("course navigation", () => {
  it("links enrolled learners to the first published chapter in module order", () => {
    expect(
      getCourseLearningHref("course-1", [
        { chapters: [] },
        { chapters: [{ id: "chapter-2" }] },
        { chapters: [{ id: "chapter-3" }] },
      ]),
    ).toBe("/courses/course-1/chapters/chapter-2");
  });

  it("falls back to the course route when a course has no published chapters", () => {
    expect(getCourseLearningHref("course-1", [{ chapters: [] }])).toBe(
      "/courses/course-1",
    );
  });
});
