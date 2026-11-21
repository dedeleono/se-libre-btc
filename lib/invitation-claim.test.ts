import { describe, it, expect } from "vitest";
import { checkInvitationClaim } from "./invitation-claim";

const now = new Date("2026-11-20T12:00:00Z");
const later = new Date("2026-11-21T12:00:00Z");
const earlier = new Date("2026-11-19T12:00:00Z");

describe("checkInvitationClaim", () => {
  it("accepts the invited email before expiry", () => {
    expect(checkInvitationClaim({ email: "ana@example.com", expires: later }, "ana@example.com", now)).toEqual({ ok: true });
  });
  it("ignores case and surrounding whitespace in the emails", () => {
    expect(checkInvitationClaim({ email: " Ana@Example.com", expires: later }, "ana@example.COM ", now)).toEqual({ ok: true });
  });
  it("rejects a different email with 403", () => {
    expect(checkInvitationClaim({ email: "ana@example.com", expires: later }, "eve@example.com", now)).toEqual({ ok: false, status: 403 });
  });
  it("rejects an expired invitation with 410", () => {
    expect(checkInvitationClaim({ email: "ana@example.com", expires: earlier }, "ana@example.com", now)).toEqual({ ok: false, status: 410 });
  });
  it("checks identity before expiry", () => {
    expect(checkInvitationClaim({ email: "ana@example.com", expires: earlier }, "eve@example.com", now)).toEqual({ ok: false, status: 403 });
  });
});
