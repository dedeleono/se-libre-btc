"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Download, X } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/constants/countries";
import { useLocale } from "@/lib/i18n";
import { hasActiveFilters, NO_REPORT_FILTERS, type ReportFilters } from "@/lib/reports/report-filters";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const DAY_FORMAT = "yyyy-MM-dd";

const toDate = (day: string | null) => {
  if (!day) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

function useWideViewport() {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

export function ReportFiltersBar({
  filters,
  courses,
  csvHref,
  threshold,
  onChange,
}: {
  filters: ReportFilters;
  courses: { id: string; title: string }[];
  csvHref: string;
  threshold: number;
  onChange: (next: ReportFilters) => void;
}) {
  const { t, locale } = useLocale();
  const a = t.analytics;
  const wide = useWideViewport();
  const urlRange = React.useMemo<DateRange | undefined>(
    () => (filters.from && filters.to ? { from: toDate(filters.from), to: toDate(filters.to) } : undefined),
    [filters.from, filters.to],
  );
  const [draftRange, setDraftRange] = React.useState(urlRange);
  React.useEffect(() => setDraftRange(urlRange), [urlRange]);

  const dateFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  );
  const countryOptions = React.useMemo(
    () => [{ label: a.allCountries, value: ALL }, ...COUNTRIES.map((country) => ({ label: country.name, value: country.name }))],
    [a.allCountries],
  );

  const handleRange = (range: DateRange | undefined) => {
    setDraftRange(range);
    if (!range?.from && !range?.to) onChange({ ...filters, from: null, to: null });
    else if (range.from && range.to) {
      onChange({ ...filters, from: format(range.from, DAY_FORMAT), to: format(range.to, DAY_FORMAT) });
    }
  };

  return (
    <section aria-labelledby="analytics-filters-heading" className="space-y-3">
      <h2 id="analytics-filters-heading" className="sr-only">
        {a.filtersLabel}
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid gap-1.5 sm:w-60">
          <Label htmlFor="analytics-course">{a.filterCourse}</Label>
          <Select
            value={filters.courseId ?? ALL}
            onValueChange={(value) => onChange({ ...filters, courseId: value === ALL ? null : value })}
          >
            <SelectTrigger id="analytics-course" className="w-full text-base sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{a.allCourses}</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 sm:w-56">
          <Label htmlFor="analytics-country">{a.filterCountry}</Label>
          <Combobox
            id="analytics-country"
            options={countryOptions}
            value={filters.country ?? ALL}
            onChange={(value) => {
              const country = typeof value === "string" && value && value !== ALL ? value : null;
              onChange({ ...filters, country });
            }}
          />
        </div>

        <div className="grid gap-1.5">
          <Label id="analytics-dates-label" htmlFor="analytics-dates">
            {a.filterDates}
          </Label>
          <CalendarDateRangePicker
            value={draftRange}
            onChange={handleRange}
            placeholder={a.anyDate}
            formatLabel={(date) => dateFormatter.format(date)}
            triggerId="analytics-dates"
            aria-labelledby="analytics-dates-label"
            calendarLocale={locale === "es" ? es : enUS}
            numberOfMonths={wide ? 2 : 1}
            triggerClassName="sm:w-[280px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:ms-auto">
          {hasActiveFilters(filters) && (
            <Button type="button" variant="ghost" onClick={() => onChange(NO_REPORT_FILTERS)}>
              <X aria-hidden="true" />
              {a.clearFilters}
            </Button>
          )}
          <a href={csvHref} download className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
            <Download aria-hidden="true" />
            {a.downloadCsv}
          </a>
        </div>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground text-pretty">
        <p>{a.cohortNote}</p>
        <p>{a.privacyNote(threshold)}</p>
      </div>
    </section>
  );
}
