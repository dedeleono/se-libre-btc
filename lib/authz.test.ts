import { describe, it, expect } from "vitest";
import type { AppSession } from "@/lib/auth";
import { decideAdmin } from "./authz";

const sessionWithRole = (role: "ADMIN" | "STUDENT"): AppSession => ({
  user: {
    id: "u1", email: "u1@example.com", name: null, image: null, role,
    emailVerified: true, onboardingCompleted: true, isDeleted: false, isBanned: false,
  },
});

describe("decideAdmin", () => {
  it("rejects a missing session with 401", () => {
    expect(decideAdmin(null)).toEqual({ ok: false, status: 401 });
  });
  it("rejects a student with 403", () => {
    expect(decideAdmin(sessionWithRole("STUDENT"))).toEqual({ ok: false, status: 403 });
  });
  it("accepts an admin and returns the same session", () => {
    const session = sessionWithRole("ADMIN");
    expect(decideAdmin(session)).toEqual({ ok: true, session });
  });
});
