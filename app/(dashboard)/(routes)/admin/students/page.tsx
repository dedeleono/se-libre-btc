import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { normalizeOptionalText, toAgeBucket } from "@/lib/demographics";
import { getServerMessages } from "@/lib/i18n-server";
import type { RawSearchParams } from "@/lib/reports/report-filters";
import {
  parseStudentFilters,
  STUDENT_PAGE_SIZE,
  studentListParams,
  toStudentWhere,
  type StudentFilters,
} from "@/lib/reports/student-filters";
import { cn } from "@/lib/utils";

import { InviteStudentForm } from "./_components/invite-student-form";
import { StudentFiltersBar } from "./_components/student-filters";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage(props: { searchParams: Promise<RawSearchParams> }) {
  const t = getServerMessages();
  const s = t.adminStudents;
  const filters = parseStudentFilters(await props.searchParams);
  const where = toStudentWhere(filters);

  const titleSelect = { id: true, title: true } as const;
  const [students, total, courses, learningPaths, cohorts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * STUDENT_PAGE_SIZE,
      take: STUDENT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        isBanned: true,
        ageRange: true,
        country: true,
        region: true,
        _count: { select: { certificates: { where: { revokedAt: null } } } },
      },
    }),
    prisma.user.count({ where }),
    prisma.course.findMany({ select: titleSelect, orderBy: { title: "asc" } }),
    prisma.learningPath.findMany({ select: titleSelect, orderBy: { title: "asc" } }),
    prisma.cohort.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: titleSelect,
      orderBy: { title: "asc" },
    }),
  ]);

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
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-primary/10 p-3">
          <Users className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t.admin.studentsTitle}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{t.admin.manageStudents}</p>
        </div>
      </div>

      <InviteStudentForm options={{ courses, learningPaths, cohorts }} />

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
            <Table>
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
                      <TableHead scope="row" className="min-w-48 py-2 font-normal">
                        <p className="font-medium">{student.name || fullName || student.email}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </TableHead>
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
            </Table>
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
    </div>
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
