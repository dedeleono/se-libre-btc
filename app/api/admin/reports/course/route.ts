import { NextResponse, type NextRequest } from "next/server";

import { loadPublicCourseReport } from "@/actions/get-course-report";
import { requireAdminApi } from "@/lib/api-auth";
import { getServerLocale } from "@/lib/i18n-server";
import { messages } from "@/lib/i18n/messages";
import { toCsv, type CsvLabels } from "@/lib/reports/csv";
import { guatemalaToday } from "@/lib/reports/report-filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const locale = getServerLocale();
  const a = messages[locale].analytics;
  const { report } = await loadPublicCourseReport(Object.fromEntries(req.nextUrl.searchParams));

  const monthFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const labels: CsvLabels = {
    header: a.csv.header,
    tiles: {
      certificatesIssued: a.tileCertificates,
      peopleCompleted: a.tileCompleted,
      completionRate: a.tileCompletionRate,
      coverage: a.tileCoverage,
    },
    steps: a.steps,
    unknown: a.unknown,
    other: a.other,
    month: (key) => monthFormat.format(new Date(`${key}-15T12:00:00Z`)),
  };

  return new NextResponse(toCsv(report, labels), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analitica-cursos-${guatemalaToday()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
