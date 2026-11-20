import { AGE_RANGES, type AgeRange } from "./constants/demographics";

export const PROFILE_NUDGE_DISMISSED_COOKIE = "se_libre_profile_nudge_dismissed";

export type AgeBucket = AgeRange | "UNKNOWN";
export const AGE_BUCKETS: readonly AgeBucket[] = [...AGE_RANGES, "UNKNOWN"];

export function isAgeRange(value: unknown): value is AgeRange {
  return (AGE_RANGES as readonly unknown[]).includes(value);
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toAgeBucket(raw: string | null | undefined): AgeBucket {
  const value = normalizeOptionalText(raw);
  return isAgeRange(value) ? value : "UNKNOWN";
}

export function isDemographicsIncomplete(user: {
  ageRange: string | null;
  country: string | null;
}): boolean {
  return toAgeBucket(user.ageRange) === "UNKNOWN" || normalizeOptionalText(user.country) === null;
}
