import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableScrollRegion } from "@/components/table-scroll-region";
import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeOptionalText, toAgeBucket } from "@/lib/demographics";
import type { Messages } from "@/lib/i18n/messages";
import { STUDENT_PAGE_SIZE, studentListParams, type StudentFilters } from "@/lib/reports/student-filters";
import { cn } from "@/lib/utils";

import { StudentFiltersBar } from "./student-filters";

export type StudentListRow = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  isBanned: boolean;
  ageRange: string | null;
  country: string | null;
  region: string | null;
  _count: { certificates: number };
};

export function StudentsList({
  students,
  total,
  filters,
  t,
}: {
  students: StudentListRow[];
  total: number;
  filters: StudentFilters;
  t: Messages;
}) {
  const s = t.adminStudents;
  const pages = Math.max(1, Math.ceil(total / STUDENT_PAGE_SIZE));
  const pageHref = (page: number) => {
    const query = studentListParams({ ...filters, page } satisfies StudentFilters).toString();
    return query ? `?${query}` : "?";
  };
  const shown = (value: string | null) => normalizeOptionalText(value) ?? s.notProvided;
  const age = (value: string | null) => {
    const bucket = toAgeBucket(value);
    return bucket === "UNKNOWN" ? s.notProvided : bucket.replace("-", "–");
  };

  return (
    <>
      <StudentFiltersBar filters={filters} />

      <Card>
        <CardHeader>
          <CardTitle className="tabular-nums">
            <h2>{t.admin.studentsCount(total)}</h2>
          </CardTitle>
          <CardDescription className="text-pretty">{s.viewOnlyNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{total === 0 && !hasStudentFilters(filters) ? t.admin.noStudentsYet : s.noMatches}</p>
          ) : (
            <TableScrollRegion label={s.tableCaption}>
              <TableCaption className="sr-only">{s.tableCaption}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{s.colStudent}</TableHead>
                  <TableHead>{s.colAge}</TableHead>
                  <TableHead>{s.colCountry}</TableHead>
                  <TableHead>{s.colRegion}</TableHead>
                  <TableHead className="text-end">{s.colCertificates}</TableHead>
                  <TableHead>{s.colStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
                  return (
                    <TableRow key={student.id}>
                      <th scope="row" className="min-w-48 py-2 px-2 text-start align-middle text-sm font-normal normal-case tracking-normal">
                        <p className="font-medium">{student.name || fullName || student.email}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </th>
                      <TableCell className="whitespace-nowrap">{age(student.ageRange)}</TableCell>
                      <TableCell>{shown(student.country)}</TableCell>
                      <TableCell>{shown(student.region)}</TableCell>
                      <TableCell className="text-end tabular-nums">{student._count.certificates}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {student.isBanned ? t.common.banned : t.common.active}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableScrollRegion>
          )}

          {pages > 1 && (
            <nav aria-label={s.pagination} className="flex flex-wrap items-center justify-between gap-3">
              <PageLink href={pageHref(filters.page - 1)} disabled={filters.page <= 1} label={s.previousPage} direction="previous" />
              <p className="text-sm text-muted-foreground tabular-nums">
                {s.pageOf(Math.min(filters.page, pages), pages)}
              </p>
              <PageLink href={pageHref(filters.page + 1)} disabled={filters.page >= pages} label={s.nextPage} direction="next" />
            </nav>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function hasStudentFilters(filters: StudentFilters) {
  return Boolean(filters.ageRange || filters.country || filters.region || filters.certificates);
}

function PageLink({
  href,
  disabled,
  label,
  direction,
}: {
  href: string;
  disabled: boolean;
  label: string;
  direction: "previous" | "next";
}) {
  const content =
    direction === "previous" ? (
      <>
        <ChevronLeft aria-hidden="true" />
        {label}
      </>
    ) : (
      <>
        {label}
        <ChevronRight aria-hidden="true" />
      </>
    );

  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-50")}>
        {content}
      </span>
    );
  }
  return (
    <Link href={href} rel={direction === "previous" ? "prev" : "next"} className={buttonVariants({ variant: "outline" })}>
      {content}
    </Link>
  );
}
