import type { Prisma } from "@prisma/client";

import { COUNTRIES, getRegionsForCountry } from "../constants/countries";
import { AGE_RANGES, type AgeRange } from "../constants/demographics";
import { isAgeRange } from "../demographics";
import { UNKNOWN } from "./keys";
import type { RawSearchParams } from "./report-filters";

export const STUDENT_PAGE_SIZE = 50;

export const CERTIFICATE_FILTERS = ["some", "none"] as const;
export type CertificateFilter = (typeof CERTIFICATE_FILTERS)[number];

export type StudentFilters = {
  ageRange: AgeRange | typeof UNKNOWN | null;
  country: string | typeof UNKNOWN | null;
  region: string | null;
  certificates: CertificateFilter | null;
  page: number;
};

const COUNTRY_NAMES = new Set(COUNTRIES.map((country) => country.name));

function first(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export function parseStudentFilters(params: RawSearchParams): StudentFilters {
  const age = first(params.age);
  const country = first(params.country);
  const region = first(params.region);
  const certificates = first(params.certificates);
  const page = Number(first(params.page));

  const validCountry = country === UNKNOWN || (country !== null && COUNTRY_NAMES.has(country)) ? country : null;

  return {
    ageRange: age === UNKNOWN ? UNKNOWN : isAgeRange(age) ? age : null,
    country: validCountry,
    region:
      validCountry && validCountry !== UNKNOWN && region && getRegionsForCountry(validCountry).includes(region)
        ? region
        : null,
    certificates: CERTIFICATE_FILTERS.find((value) => value === certificates) ?? null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

export function toStudentWhere(filters: StudentFilters) {
  const and: Prisma.UserWhereInput[] = [];

  if (filters.ageRange === UNKNOWN) and.push({ OR: [{ ageRange: null }, { ageRange: { notIn: [...AGE_RANGES] } }] });
  else if (filters.ageRange) and.push({ ageRange: filters.ageRange });

  if (filters.country === UNKNOWN) and.push({ OR: [{ country: null }, { country: "" }] });
  else if (filters.country) and.push({ country: filters.country });

  if (filters.region) and.push({ region: filters.region });

  if (filters.certificates === "some") and.push({ certificates: { some: { revokedAt: null } } });
  if (filters.certificates === "none") and.push({ certificates: { none: { revokedAt: null } } });

  return { role: "STUDENT", isDeleted: false, AND: and } satisfies Prisma.UserWhereInput;
}

export function studentListParams(filters: StudentFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: [string, string | null][] = [
    ["age", filters.ageRange],
    ["country", filters.country],
    ["region", filters.region],
    ["certificates", filters.certificates],
    ["page", filters.page > 1 ? String(filters.page) : null],
  ];
  for (const [key, value] of entries) if (value !== null) params.set(key, value);
  return params;
}
