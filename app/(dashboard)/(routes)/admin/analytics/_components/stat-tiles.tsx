"use client";

import { Award, GraduationCap, Percent as PercentIcon, UsersRound, type LucideIcon } from "lucide-react";
import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicCourseReport } from "@/lib/reports/publish";

import { CellValue, PercentValue, useReportFormat } from "./cells";

function Tile({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: React.ReactNode; detail: string }) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-5">
        <CardTitle className="font-sans text-xs font-bold normal-case leading-snug tracking-normal sm:text-sm">{label}</CardTitle>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-1 px-5">
        <p className="text-2xl font-bold leading-none sm:text-3xl">{value}</p>
        <p className="text-xs text-muted-foreground text-pretty">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function StatTiles({ report }: { report: PublicCourseReport }) {
  const { t, cellText } = useReportFormat(report.threshold);
  const { tiles, threshold } = report;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile
        icon={Award}
        label={t.analytics.tileCertificates}
        value={<CellValue cell={tiles.certificatesIssued} threshold={threshold} />}
        detail={t.analytics.certificatesDetail}
      />
      <Tile
        icon={GraduationCap}
        label={t.analytics.tileCompleted}
        value={<CellValue cell={tiles.peopleCompleted} threshold={threshold} />}
        detail={t.analytics.completedDetail}
      />
      <Tile
        icon={PercentIcon}
        label={t.analytics.tileCompletionRate}
        value={<PercentValue value={tiles.completionRate} />}
        detail={t.analytics.completionRateDetail}
      />
      <Tile
        icon={UsersRound}
        label={t.analytics.tileCoverage}
        value={<PercentValue value={tiles.coverage} />}
        detail={t.analytics.coverageDetail(cellText(tiles.withDemographics), cellText(tiles.students))}
      />
    </div>
  );
}
