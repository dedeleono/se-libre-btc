"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableScrollRegion } from "@/components/table-scroll-region";
import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PublicCourseReport } from "@/lib/reports/publish";
import { toSearchParams } from "@/lib/reports/report-filters";

import { CellValue, PercentValue, useReportFormat } from "./cells";

export function CourseTable({ report }: { report: PublicCourseReport }) {
  const { t } = useReportFormat(report.threshold);
  const a = t.analytics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{a.byCourseTitle}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableScrollRegion label={a.byCourseTitle}>
          <TableCaption className="sr-only">{a.byCourseTitle}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{a.colCourse}</TableHead>
              <TableHead className="text-end">{a.colEnrolled}</TableHead>
              <TableHead className="text-end">{a.colCompleted}</TableHead>
              <TableHead className="text-end">{a.colCertified}</TableHead>
              <TableHead className="text-end">{a.colRate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byCourse.map((row) => (
              <TableRow key={row.key}>
                <th scope="row" className="min-w-48 py-2 whitespace-normal px-2 text-start align-middle text-sm font-normal normal-case tracking-normal">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`?${toSearchParams({ ...report.filters, courseId: row.key })}`}
                      scroll={false}
                      className="rounded-[2px] font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {row.title}
                    </Link>
                    {row.finalExam !== "RESOLVED" && (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {a.finalExamBadge[row.finalExam]}
                      </Badge>
                    )}
                  </div>
                </th>
                <TableCell className="text-end tabular-nums">
                  <CellValue cell={row.students} threshold={report.threshold} />
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  <CellValue cell={row.completed} threshold={report.threshold} />
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  <CellValue cell={row.certified} threshold={report.threshold} />
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  <PercentValue value={row.completionRate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableScrollRegion>
      </CardContent>
    </Card>
  );
}
