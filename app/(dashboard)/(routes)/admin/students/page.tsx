import { Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";
import type { RawSearchParams } from "@/lib/reports/report-filters";
import { parseStudentFilters, STUDENT_PAGE_SIZE, toStudentWhere } from "@/lib/reports/student-filters";

import { InviteStudentForm } from "./_components/invite-student-form";
import { StudentsList } from "./_components/students-list";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage(props: { searchParams: Promise<RawSearchParams> }) {
  const t = getServerMessages();
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

      <StudentsList students={students} total={total} filters={filters} t={t} />
    </div>
  );
}
