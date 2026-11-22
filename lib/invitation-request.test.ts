import { describe, it, expect } from "vitest";
import { INVITATION_TTL_MS, invitationExpiry, parseInvitationRequest } from "./invitation-request";

const valid = { firstName: " Ana ", lastName: "López", email: " Ana@Example.com " };

describe("parseInvitationRequest", () => {
  it("normalises names and email and defaults to no access", () => {
    expect(parseInvitationRequest(valid)).toEqual({
      ok: true,
      data: { firstName: "Ana", lastName: "López", email: "ana@example.com", access: { type: "none" } },
    });
  });
  it("never reads a role from the body", () => {
    const parsed = parseInvitationRequest({ ...valid, role: "ADMIN" });
    expect(parsed.ok && "role" in parsed.data).toBe(false);
  });
  it("drops a phone number from the body", () => {
    const parsed = parseInvitationRequest({ ...valid, phone: "5555-5555" });
    expect(parsed.ok && "phone" in parsed.data).toBe(false);
  });
  it.each(["course", "learningPath", "cohort"] as const)("accepts %s access with an id", (type) => {
    expect(parseInvitationRequest({ ...valid, access: { type, id: "abc" } })).toMatchObject({
      ok: true,
      data: { access: { type, id: "abc" } },
    });
  });
  it("rejects access without an id", () => {
    expect(parseInvitationRequest({ ...valid, access: { type: "course" } })).toEqual({ ok: false });
  });
  it("rejects an invalid email", () => {
    expect(parseInvitationRequest({ ...valid, email: "not-an-email" })).toEqual({ ok: false });
  });
  it("rejects a blank first name", () => {
    expect(parseInvitationRequest({ ...valid, firstName: "   " })).toEqual({ ok: false });
  });
  it("rejects a missing body", () => {
    expect(parseInvitationRequest(null)).toEqual({ ok: false });
  });
});

describe("invitationExpiry", () => {
  it("expires seven days after it is created", () => {
    const now = new Date("2026-11-21T00:00:00Z");
    expect(INVITATION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(invitationExpiry(now).toISOString()).toBe("2026-11-28T00:00:00.000Z");
  });
});
