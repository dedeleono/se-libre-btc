import { z } from "zod";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const invitationRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  access: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("none") }),
      z.object({ type: z.literal("course"), id: z.string().min(1) }),
      z.object({ type: z.literal("learningPath"), id: z.string().min(1) }),
      z.object({ type: z.literal("cohort"), id: z.string().min(1) }),
    ])
    .default({ type: "none" }),
});

export type InvitationRequest = z.infer<typeof invitationRequestSchema>;
export type InvitationAccess = InvitationRequest["access"];

export function parseInvitationRequest(body: unknown): { ok: true; data: InvitationRequest } | { ok: false } {
  const parsed = invitationRequestSchema.safeParse(body);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false };
}

export function invitationExpiry(now: Date): Date {
  return new Date(now.getTime() + INVITATION_TTL_MS);
}
