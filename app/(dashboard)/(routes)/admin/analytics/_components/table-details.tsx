"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";

import { TableScrollRegion } from "@/components/table-scroll-region";
import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from "@/lib/i18n";

export type DetailsRow = { key: string; header: React.ReactNode; cells: React.ReactNode[] };

export function TableDetails({
  chartName,
  columns,
  rows,
}: {
  chartName: string;
  columns: string[];
  rows: DetailsRow[];
}) {
  const { t } = useLocale();

  return (
    <details className="group mt-4">
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-[2px] text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-90" aria-hidden="true" />
        {t.analytics.viewAsTable}
      </summary>
      <TableScrollRegion label={t.analytics.tableCaption(chartName)} className="mt-2">
        <TableCaption className="sr-only">{t.analytics.tableCaption(chartName)}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column, i) => (
              <TableHead key={column} className={i === 0 ? undefined : "text-end"}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <th scope="row" className="px-2 text-start align-middle text-sm font-normal normal-case tracking-normal">
                {row.header}
              </th>
              {row.cells.map((cell, i) => (
                <TableCell key={i} className="text-end tabular-nums">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableScrollRegion>
    </details>
  );
}
