export type InvitationClaim = { ok: true } | { ok: false; status: 403 | 410 };

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export function checkInvitationClaim(
  invitation: { email: string; expires: Date },
  sessionEmail: string,
  now: Date
): InvitationClaim {
  if (normaliseEmail(invitation.email) !== normaliseEmail(sessionEmail)) return { ok: false, status: 403 };
  if (invitation.expires.getTime() <= now.getTime()) return { ok: false, status: 410 };
  return { ok: true };
}
