"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Cell } from "@/lib/reports/publish";
import { cn } from "@/lib/utils";

import { CellValue } from "./cells";

export type BarListRow = {
  key: string;
  label: string;
  value: Cell;
  tone?: "data" | "neutral";
  aside?: React.ReactNode;
  note?: string;
  tooltip?: string;
};

export function BarList({
  rows,
  threshold,
  label,
  scaleTo,
}: {
  rows: BarListRow[];
  threshold: number;
  label: string;
  scaleTo?: Cell;
}) {
  const visible = rows.flatMap((row) => (row.value.kind === "value" ? [row.value.value] : []));
  const max = scaleTo?.kind === "value" ? scaleTo.value : Math.max(0, ...visible);

  return (
    <TooltipProvider delayDuration={150}>
      <ul
        aria-label={label}
        className="grid grid-cols-[minmax(5rem,7rem)_1fr_auto] gap-x-3 gap-y-1 sm:grid-cols-[minmax(6rem,11rem)_1fr_auto]"
      >
        {rows.map((row) => {
          const width = row.value.kind === "value" && max > 0 ? (row.value.value / max) * 100 : 0;
          const item = (
            <li
              tabIndex={row.tooltip ? 0 : undefined}
              className={cn(
                "col-span-3 grid min-h-10 grid-cols-subgrid items-center gap-y-1 rounded-[2px] px-2 py-1.5 transition-colors duration-150",
                row.tooltip &&
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              )}
            >
                <span className="line-clamp-2 text-sm leading-snug" title={row.label}>
                  {row.label}
                </span>
                <div className="h-5 bg-muted/70" aria-hidden="true">
                  {width > 0 && (
                    <div
                      className={cn(
                        "h-full min-w-0.5 rounded-e-[4px]",
                        row.tone === "neutral" ? "bg-muted-foreground/45" : "bg-[hsl(var(--chart-1))]",
                      )}
                      style={{ inlineSize: `${width}%` }}
                    />
                  )}
                </div>
                <span className="flex items-baseline justify-end gap-2 text-end text-sm">
                  <span className="font-semibold tabular-nums">
                    <CellValue cell={row.value} threshold={threshold} />
                  </span>
                  {row.aside && <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">{row.aside}</span>}
                </span>
              {row.aside && <p className="col-span-3 text-xs text-muted-foreground tabular-nums sm:hidden">{row.aside}</p>}
              {row.note && <p className="col-span-3 text-xs text-muted-foreground text-pretty">{row.note}</p>}
            </li>
          );

          if (!row.tooltip) return <React.Fragment key={row.key}>{item}</React.Fragment>;
          return (
            <Tooltip key={row.key}>
              <TooltipTrigger asChild>{item}</TooltipTrigger>
              <TooltipContent side="top" align="end">
                {row.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
