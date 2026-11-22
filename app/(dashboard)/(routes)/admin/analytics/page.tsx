import { UserRole } from "@prisma/client";
import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

import { loadPublicCourseReport } from "@/actions/get-course-report";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { getServerMessages } from "@/lib/i18n-server";
import type { RawSearchParams } from "@/lib/reports/report-filters";

import { AnalyticsWorkspace } from "./_components/analytics-workspace";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage(props: { searchParams: Promise<RawSearchParams> }) {
  const session = await auth();
  if (session?.user?.role !== UserRole.ADMIN) redirect("/unauthorized");

  const t = await getServerMessages();
  const { courses, report, issues } = await loadPublicCourseReport(await props.searchParams);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-primary/10 p-3">
          <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t.analytics.title}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{t.analytics.subtitle}</p>
        </div>
      </div>

      {issues.length > 0 && (
        <Alert>
          <AlertTitle>{t.analytics.ignoredFilters}</AlertTitle>
          <AlertDescription>{issues.map((issue) => t.analytics.issues[issue]).join(" · ")}</AlertDescription>
        </Alert>
      )}

      <AnalyticsWorkspace report={report} courses={courses} csvPath="/api/admin/reports/course" />
    </div>
  );
}
