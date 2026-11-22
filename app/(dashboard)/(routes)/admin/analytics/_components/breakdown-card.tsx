"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTHER, UNKNOWN } from "@/lib/reports/keys";
import type { PublicBreakdownRow } from "@/lib/reports/publish";

import { BarList } from "./bar-list";
import { CellValue, PercentValue, useReportFormat } from "./cells";
import { TableDetails } from "./table-details";

export function BreakdownCard({
  title,
  rows,
  threshold,
  labelFor,
}: {
  title: string;
  rows: PublicBreakdownRow<string>[];
  threshold: number;
  labelFor?: (key: string) => string;
}) {
  const { t, cellText, percentText } = useReportFormat(threshold);
  const a = t.analytics;
  const label = (key: string) => (key === UNKNOWN ? a.unknown : key === OTHER ? a.other : (labelFor?.(key) ?? key));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription className="text-pretty">{a.breakdownDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList
          label={title}
          threshold={threshold}
          rows={rows.map((row) => ({
            key: row.key,
            label: label(row.key),
            value: row.students,
            tone: row.key === UNKNOWN || row.key === OTHER ? "neutral" : "data",
            tooltip: a.rowTooltip(cellText(row.completed), cellText(row.certified), percentText(row.completionRate)),
          }))}
        />
        <TableDetails
          chartName={title}
          columns={[a.colGroup, a.colStudents, a.colCompleted, a.colCertified, a.colRate]}
          rows={rows.map((row) => ({
            key: row.key,
            header: label(row.key),
            cells: [
              <CellValue key="students" cell={row.students} threshold={threshold} />,
              <CellValue key="completed" cell={row.completed} threshold={threshold} />,
              <CellValue key="certified" cell={row.certified} threshold={threshold} />,
              <PercentValue key="rate" value={row.completionRate} />,
            ],
          }))}
        />
      </CardContent>
    </Card>
  );
}
