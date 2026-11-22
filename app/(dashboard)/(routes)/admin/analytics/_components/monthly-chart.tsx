"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PublicCourseReport } from "@/lib/reports/publish";
import { cn } from "@/lib/utils";

import { CellValue, useReportFormat } from "./cells";
import { TableDetails } from "./table-details";

export function MonthlyChart({ report }: { report: PublicCourseReport }) {
  const { t, cellText, monthShort, monthLong } = useReportFormat(report.threshold);
  const a = t.analytics;
  const months = report.certificatesByMonth;
  const values = months.map((month) => (month.count.kind === "value" ? month.count.value : 0));
  const max = Math.max(0, ...values);
  const hasAny = months.some((month) => month.count.kind === "suppressed" || month.count.value > 0);
  const peakIndex = values.lastIndexOf(max);
  const lastIndex = months.length - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{a.monthlyTitle}</h2>
        </CardTitle>
        <CardDescription className="text-pretty">{a.monthlyDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <TooltipProvider delayDuration={150}>
            <ol aria-label={a.monthlyTitle} className="grid h-48 grid-cols-12 items-end gap-0.5 border-b border-border sm:gap-2">
              {months.map((month, i) => {
                const value = values[i];
                const height = max > 0 ? (value / max) * 100 : 0;
                const labelled = month.count.kind === "suppressed" || (value > 0 && (i === peakIndex || i === lastIndex));
                return (
                  <Tooltip key={month.month}>
                    <TooltipTrigger asChild>
                      <li
                        tabIndex={0}
                        className="group relative flex h-full flex-col items-center justify-end rounded-t-[2px] transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="sr-only">{monthLong(month.month)}: </span>
                        <span
                          className={cn(
                            "mb-1 text-[11px] font-semibold tabular-nums sm:text-xs",
                            month.count.kind === "suppressed" && "font-normal text-muted-foreground",
                            !labelled && "sr-only",
                          )}
                        >
                          <CellValue cell={month.count} threshold={report.threshold} />
                        </span>
                        {height > 0 && (
                          <span
                            aria-hidden="true"
                            className="w-full max-w-6 rounded-t-[4px] bg-[hsl(var(--chart-1))]"
                            style={{ blockSize: `${height}%` }}
                          />
                        )}
                      </li>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {monthLong(month.month)}: {cellText(month.count)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </ol>
            <div aria-hidden="true" className="mt-1.5 grid grid-cols-12 gap-0.5 text-center text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
              {months.map((month, i) => (
                <span key={month.month} className={cn("truncate", i % 2 === 1 && i !== lastIndex && "max-sm:invisible")}>
                  {monthShort(month.month)}
                </span>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <p className="text-sm text-muted-foreground">{a.monthlyEmpty}</p>
        )}
        <TableDetails
          chartName={a.monthlyTitle}
          columns={[a.colMonth, a.colCertified]}
          rows={months.map((month) => ({
            key: month.month,
            header: monthLong(month.month),
            cells: [<CellValue key="count" cell={month.count} threshold={report.threshold} />],
          }))}
        />
      </CardContent>
    </Card>
  );
}
