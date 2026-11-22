import { z } from "zod";
import type { AgeRange } from "../constants/demographics";
import { COUNTRIES, getRegionsForCountry } from "../constants/countries";
import { isAgeRange, normalizeOptionalText } from "../demographics";

export type ProfileUpdate = {
  name?: string;
  image?: string | null;
  onboardingCompleted?: boolean;
  phone?: string | null;
  ageRange?: AgeRange | null;
  country?: string | null;
  region?: string | null;
};

const FIELD_ERROR_CODES = {
  name: "INVALID_NAME",
  imageUrl: "INVALID_IMAGE_URL",
  onboardingCompleted: "INVALID_ONBOARDING_COMPLETED",
  phone: "INVALID_PHONE",
  ageRange: "INVALID_AGE_RANGE",
  country: "INVALID_COUNTRY",
  region: "INVALID_REGION",
} as const;

export type ProfileField = keyof typeof FIELD_ERROR_CODES;
export type ProfileFieldErrors = Partial<Record<ProfileField | "body", string[]>>;

export type ProfileUpdateResult =
  | { ok: true; data: ProfileUpdate }
  | { ok: false; fieldErrors: ProfileFieldErrors };

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const MIN_PHONE_DIGITS = 7;
const COUNTRY_NAMES = new Set(COUNTRIES.map((country) => country.name));

const optionalText = z.preprocess(
  (value) => (typeof value === "string" ? normalizeOptionalText(value) : value),
  z.string().nullable().optional(),
);

const phone = optionalText
  .refine(
    (value) =>
      value == null ||
      (PHONE_PATTERN.test(value) && value.replace(/\D/g, "").length >= MIN_PHONE_DIGITS),
  )
  .transform((value) =>
    value == null ? value : `${value.startsWith("+") ? "+" : ""}${value.replace(/\D/g, "")}`,
  );

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    imageUrl: z.string().max(2048).nullable().optional(),
    onboardingCompleted: z.boolean().optional(),
    phone,
    ageRange: optionalText.refine(
      (value): value is AgeRange | null | undefined => value == null || isAgeRange(value),
    ),
    country: optionalText.refine((value) => value == null || COUNTRY_NAMES.has(value)),
    region: optionalText,
  })
  .superRefine(({ country, region }, ctx) => {
    if (region == null) return;
    if (!country || !getRegionsForCountry(country).includes(region)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["region"] });
    }
  });

export function parseProfileUpdate(body: unknown): ProfileUpdateResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, fieldErrors: { body: ["INVALID_BODY"] } };
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: ProfileFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ProfileField;
      fieldErrors[field] = [FIELD_ERROR_CODES[field]];
    }
    return { ok: false, fieldErrors };
  }

  const { imageUrl, ...fields } = parsed.data;
  const data: ProfileUpdate = { ...fields, image: imageUrl };
  return {
    ok: true,
    data: Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as ProfileUpdate,
  };
}
