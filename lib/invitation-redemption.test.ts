import { describe, it, expect } from "vitest";
import { decideInvitationRedemption } from "./invitation-redemption";

const now = new Date("2026-11-21T12:00:00Z");
const later = new Date("2026-11-22T12:00:00Z");
const earlier = new Date("2026-11-20T12:00:00Z");

describe("decideInvitationRedemption", () => {
  it("accepts an unexpired student invitation", () => {
    expect(decideInvitationRedemption({ role: "STUDENT", expires: later }, now)).toEqual({ ok: true });
  });
  it("rejects an admin invitation", () => {
    expect(decideInvitationRedemption({ role: "ADMIN", expires: later }, now)).toEqual({ ok: false, reason: "not_student" });
  });
  it("rejects an expired admin invitation as not a student invitation", () => {
    expect(decideInvitationRedemption({ role: "ADMIN", expires: earlier }, now)).toEqual({ ok: false, reason: "not_student" });
  });
  it("rejects an expired student invitation", () => {
    expect(decideInvitationRedemption({ role: "STUDENT", expires: earlier }, now)).toEqual({ ok: false, reason: "expired" });
  });
  it("treats an invitation that expires exactly now as expired", () => {
    expect(decideInvitationRedemption({ role: "STUDENT", expires: now }, now)).toEqual({ ok: false, reason: "expired" });
  });
});
