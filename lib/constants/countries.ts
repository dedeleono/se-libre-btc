import * as countryRegionData from "country-region-data";

// country-region-data may export the array directly, under `.default`, or as
// `allCountries` depending on the build/bundler. Normalize defensively.
const raw: any[] =
  (Array.isArray(countryRegionData as any) && (countryRegionData as any)) ||
  (countryRegionData as any).default ||
  (countryRegionData as any).allCountries ||
  [];

export interface CountryOption {
  /** Display name, e.g. "United States". Used as both label and stored value. */
  name: string;
  /** Region display names, e.g. ["Alabama", "Alaska", ...]. */
  regions: string[];
}

/**
 * Each country entry is either:
 *  - a tuple `[countryName, countryShortCode, regions]` (country-region-data v4),
 *  - or an object `{ countryName, regions }` (older shapes / mocks).
 * Each region entry is either a tuple `[name, code]` or an object `{ name, shortCode }`.
 * Normalize both defensively into `{ name, regions: string[] }`.
 */
function countryName(c: any): string {
  return Array.isArray(c) ? c[0] : c.countryName;
}

function countryRegions(c: any): any[] {
  return (Array.isArray(c) ? c[2] : c.regions) ?? [];
}

function regionName(r: any): string {
  return Array.isArray(r) ? r[0] : r.name;
}

export const COUNTRIES: CountryOption[] = raw
  .map((c) => ({
    name: countryName(c),
    regions: countryRegions(c).map(regionName),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getRegionsForCountry(countryName: string): string[] {
  return COUNTRIES.find((c) => c.name === countryName)?.regions ?? [];
}

export function countryHasRegions(countryName: string): boolean {
  return getRegionsForCountry(countryName).length > 0;
}
