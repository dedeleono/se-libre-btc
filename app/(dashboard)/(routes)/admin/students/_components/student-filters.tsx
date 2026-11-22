"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, getRegionsForCountry } from "@/lib/constants/countries";
import { AGE_RANGES } from "@/lib/constants/demographics";
import { useLocale } from "@/lib/i18n";
import { UNKNOWN } from "@/lib/reports/keys";
import { studentListParams, type StudentFilters } from "@/lib/reports/student-filters";

const ALL = "__all__";

export function StudentFiltersBar({ filters }: { filters: StudentFilters }) {
  const { t } = useLocale();
  const s = t.adminStudents;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();

  const apply = (next: Partial<StudentFilters>) => {
    const query = studentListParams({ ...filters, ...next, page: 1 }).toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  const countryOptions = React.useMemo(
    () => [
      { label: s.allCountries, value: ALL },
      { label: s.notProvided, value: UNKNOWN },
      ...COUNTRIES.map((country) => ({ label: country.name, value: country.name })),
    ],
    [s.allCountries, s.notProvided],
  );
  const regions = filters.country && filters.country !== UNKNOWN ? getRegionsForCountry(filters.country) : [];
  const active = Boolean(filters.ageRange || filters.country || filters.region || filters.certificates);

  return (
    <div aria-busy={pending} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid gap-1.5 sm:w-48">
        <Label htmlFor="students-age">{s.filterAge}</Label>
        <Select value={filters.ageRange ?? ALL} onValueChange={(value) => apply({ ageRange: value === ALL ? null : (value as StudentFilters["ageRange"]) })}>
          <SelectTrigger id="students-age" className="w-full text-base sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{s.allAges}</SelectItem>
            {AGE_RANGES.map((range) => (
              <SelectItem key={range} value={range}>
                {range.replace("-", "–")}
              </SelectItem>
            ))}
            <SelectItem value={UNKNOWN}>{s.notProvided}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5 sm:w-56">
        <Label htmlFor="students-country">{s.filterCountry}</Label>
        <Combobox
          id="students-country"
          options={countryOptions}
          value={filters.country ?? ALL}
          onChange={(value) => {
            const country = typeof value === "string" && value && value !== ALL ? value : null;
            apply({ country, region: null });
          }}
        />
      </div>

      {regions.length > 0 && (
        <div className="grid gap-1.5 sm:w-56">
          <Label htmlFor="students-region">{s.filterRegion}</Label>
          <Select value={filters.region ?? ALL} onValueChange={(value) => apply({ region: value === ALL ? null : value })}>
            <SelectTrigger id="students-region" className="w-full text-base sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{s.allRegions}</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-1.5 sm:w-48">
        <Label htmlFor="students-certificates">{s.filterCertificates}</Label>
        <Select
          value={filters.certificates ?? ALL}
          onValueChange={(value) => apply({ certificates: value === "some" || value === "none" ? value : null })}
        >
          <SelectTrigger id="students-certificates" className="w-full text-base sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{s.anyCertificates}</SelectItem>
            <SelectItem value="some">{s.withCertificates}</SelectItem>
            <SelectItem value="none">{s.withoutCertificates}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {active && (
        <Button type="button" variant="ghost" onClick={() => apply({ ageRange: null, country: null, region: null, certificates: null })}>
          <X aria-hidden="true" />
          {s.clearFilters}
        </Button>
      )}
    </div>
  );
}
