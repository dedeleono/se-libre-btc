import { describe, it, expect } from "vitest";
import { canReadForumPost } from "./forum-access";

const none = { courseIds: [], learningPathIds: [], cohortIds: [] };
const post = { courseId: "c1", learningPathId: null, cohortId: null };

describe("canReadForumPost", () => {
  it("lets an admin read any post", () => {
    expect(canReadForumPost("ADMIN", post, none)).toBe(true);
  });
  it("lets a student enrolled in the post's course read it", () => {
    expect(canReadForumPost("STUDENT", post, { ...none, courseIds: ["c1"] })).toBe(true);
  });
  it("lets a student enrolled in the post's learning path read it", () => {
    expect(canReadForumPost("STUDENT", { ...post, courseId: null, learningPathId: "p1" }, { ...none, learningPathIds: ["p1"] })).toBe(true);
  });
  it("lets a student enrolled in the post's cohort read it", () => {
    expect(canReadForumPost("STUDENT", { ...post, courseId: null, cohortId: "h1" }, { ...none, cohortIds: ["h1"] })).toBe(true);
  });
  it("refuses a student enrolled somewhere else", () => {
    expect(canReadForumPost("STUDENT", post, { ...none, courseIds: ["c2"] })).toBe(false);
  });
  it("refuses a student when the post has no scope", () => {
    expect(canReadForumPost("STUDENT", { courseId: null, learningPathId: null, cohortId: null }, { courseIds: ["c1"], learningPathIds: ["p1"], cohortIds: ["h1"] })).toBe(false);
  });
});
