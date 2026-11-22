import { describe, expect, it } from "vitest";

import { isPublicRoute } from "./public-routes";

describe("isPublicRoute", () => {
  it.each([
    "/",
    "/courses",
    "/error",
    "/sign-in",
    "/verify-request",
    "/learning-paths/abc",
    "/courses/preview/abc",
    "/verify/DL-2026-7QK4ZP",
  ])("%s is public", (pathname) => {
    expect(isPublicRoute(pathname)).toBe(true);
  });

  it.each([
    "/student",
    "/admin/courses",
    "/courses/abc/chapters/def",
    "/courses/abc/complete",
    "/verify",
    "/verifyX/abc",
    "/learning-paths-x",
  ])("%s needs a session", (pathname) => {
    expect(isPublicRoute(pathname)).toBe(false);
  });
});
