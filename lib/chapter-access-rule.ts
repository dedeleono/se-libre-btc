import type { UserRole } from "@prisma/client";

export type ChapterLockReason = "SIGN_IN_REQUIRED" | "ENROLLMENT_REQUIRED";

export type ChapterAccess =
  | { accessible: true }
  | { accessible: false; reason: ChapterLockReason };

// The one rule for who may open a chapter. The course sidebar, the chapter
// page, and the chapter write policy all call it.
export function resolveChapterAccess(input: {
  isAuthenticated: boolean;
  role: UserRole | null;
  isIntro: boolean;
  hasEnrollment: boolean;
}): ChapterAccess {
  if (input.isIntro) return { accessible: true };
  if (!input.isAuthenticated) return { accessible: false, reason: "SIGN_IN_REQUIRED" };
  if (input.role === "ADMIN") return { accessible: true };
  if (input.hasEnrollment) return { accessible: true };
  return { accessible: false, reason: "ENROLLMENT_REQUIRED" };
}
