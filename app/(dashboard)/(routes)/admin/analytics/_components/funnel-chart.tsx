"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicCourseReport } from "@/lib/reports/publish";

import { BarList, type BarListRow } from "./bar-list";
import { CellValue, PercentValue, useReportFormat } from "./cells";
import { TableDetails } from "./table-details";

export function FunnelChart({ report }: { report: PublicCourseReport }) {
  const { t, percentText } = useReportFormat(report.threshold);
  const a = t.analytics;
  const enrolled = report.funnel[0]?.count;

  const noteFor = (step: string) => {
    if (step === "CERTIFIED") return a.certifiedNote;
    if (step === "FINAL_PASSED" && report.finalExam === "NO_QUIZZES") return a.noQuizzesNote;
    if (step === "FINAL_PASSED" && report.finalExam === "UNRESOLVED") return a.unresolvedNote;
    return undefined;
  };

  const rows: BarListRow[] = report.funnel.map((step) => ({
    key: step.step,
    label: a.steps[step.step],
    value: step.count,
    aside: step.conversionFromPrevious === null ? undefined : a.ofPreviousStep(percentText(step.conversionFromPrevious)),
    note: noteFor(step.step),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{a.funnelTitle}</h2>
        </CardTitle>
        <CardDescription className="text-pretty">
          {report.unit === "PEOPLE" ? a.funnelUnitPeople : a.funnelUnitEnrollments}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BarList rows={rows} threshold={report.threshold} label={a.funnelTitle} scaleTo={enrolled} />
        <TableDetails
          chartName={a.funnelTitle}
          columns={[a.colGroup, a.colCount, a.colConversion]}
          rows={report.funnel.map((step) => ({
            key: step.step,
            header: a.steps[step.step],
            cells: [
              <CellValue key="count" cell={step.count} threshold={report.threshold} />,
              <PercentValue key="conversion" value={step.conversionFromPrevious} />,
            ],
          }))}
        />
      </CardContent>
    </Card>
  );
}
