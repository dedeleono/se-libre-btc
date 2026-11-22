export type InvitationRedemption = { ok: true } | { ok: false; reason: "not_student" | "expired" };

export function decideInvitationRedemption(
  invitation: { role: string; expires: Date },
  now: Date
): InvitationRedemption {
  if (invitation.role !== "STUDENT") return { ok: false, reason: "not_student" };
  if (invitation.expires.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true };
}
