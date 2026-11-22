"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, type Locale, type Messages } from "@/lib/i18n";
import {
  isAllZero,
  niceTicks,
  overviewMonthLabel,
  revenueTick,
  type OverviewMetric,
  type OverviewRow,
} from "@/lib/overview-chart";
import { formatPrice } from "@/lib/utils";

const formatCount = (value: number, locale: Locale) => new Intl.NumberFormat(locale).format(value);

const SERIES = {
  revenue: {
    color: "hsl(var(--chart-1))",
    label: (t: Messages) => t.dashboard.revenue,
    format: (value: number) => formatPrice(value),
  },
  students: {
    color: "hsl(var(--chart-2))",
    label: (t: Messages) => t.dashboard.newStudents,
    format: formatCount,
  },
  courses: {
    color: "hsl(var(--chart-3))",
    label: (t: Messages) => t.dashboard.newCourses,
    format: formatCount,
  },
} satisfies Record<
  OverviewMetric,
  { color: string; label: (t: Messages) => string; format: (value: number, locale: Locale) => string }
>;

const TABLE_METRICS: OverviewMetric[] = ["revenue", "students", "courses"];
const GROWTH_METRICS: OverviewMetric[] = ["students", "courses"];

// CardContent is pl-2 so the y-axis ticks fit; text steps in to the card title's edge.
const TEXT_INSET = "ps-4";

// Global h1–h6 use the uppercase display face; these sit under the Open Sans card title.
const SUBHEADING = "[font-family:inherit] text-sm font-medium normal-case leading-snug text-foreground";

const AXIS_STYLE = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

const CHART_FOCUS =
  "[&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-ring";

function Swatch({ metric }: { metric: OverviewMetric }) {
  return (
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-[2px]"
      style={{ backgroundColor: SERIES[metric].color }}
    />
  );
}

function OverviewTooltip({
  active,
  payload,
  metrics,
}: TooltipProps<number, string> & { metrics: OverviewMetric[] }) {
  const { locale, t } = useLocale();
  const row = payload?.[0]?.payload as OverviewRow | undefined;
  if (!active || !row) return null;

  return (
    <div className="rounded-[2px] border bg-popover p-2 text-popover-foreground shadow-sm">
      <p className="text-xs text-muted-foreground">{overviewMonthLabel(row.monthStart, locale, "long")}</p>
      <dl className="mt-1 space-y-0.5 text-sm">
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-2">
            <Swatch metric={metric} />
            <dt className="text-muted-foreground">{SERIES[metric].label(t)}</dt>
            <dd className="ms-auto ps-3 font-medium tabular-nums text-foreground">
              {SERIES[metric].format(row[metric], locale)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MetricChart({
  data,
  metrics,
  title,
  maxBarSize,
  yAxis,
}: {
  data: OverviewRow[];
  metrics: OverviewMetric[];
  title: string;
  maxBarSize: number;
  yAxis: { width: number; tickFormatter?: (value: number) => string; integer?: boolean };
}) {
  const { locale, t } = useLocale();
  const ticks = niceTicks(Math.max(...data.flatMap((row) => metrics.map((metric) => row[metric]))), {
    integer: yAxis.integer,
  });
  // recharts keeps the keyboard tooltip up after focus moves on; hide it until the chart is used again.
  const [tooltipHidden, setTooltipHidden] = useState(false);

  return (
    <div
      className={`h-56 sm:h-60 [&_.recharts-cartesian-axis-tick-value]:tabular-nums ${CHART_FOCUS}`}
      onBlur={() => setTooltipHidden(true)}
      onFocus={() => setTooltipHidden(false)}
      onMouseMove={() => setTooltipHidden(false)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          title={title}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid vertical={false} stroke="hsl(var(--muted-foreground) / 0.18)" />
          <XAxis
            dataKey="monthStart"
            tickFormatter={(iso: string) => overviewMonthLabel(iso, locale, "short")}
            interval="preserveStartEnd"
            minTickGap={8}
            {...AXIS_STYLE}
          />
          <YAxis
            width={yAxis.width}
            tickFormatter={yAxis.tickFormatter}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            interval={0}
            {...AXIS_STYLE}
          />
          <Tooltip
            active={tooltipHidden ? false : undefined}
            cursor={{ fill: "hsl(var(--muted) / 0.6)" }}
            isAnimationActive={false}
            content={<OverviewTooltip metrics={metrics} />}
          />
          {metrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              name={SERIES[metric].label(t)}
              fill={SERIES[metric].color}
              radius={[4, 4, 0, 0]}
              maxBarSize={maxBarSize}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ children }: { children: string }) {
  return <p className={`${TEXT_INSET} text-sm text-muted-foreground text-pretty`}>{children}</p>;
}

function OverviewTable({ data }: { data: OverviewRow[] }) {
  const { locale, t } = useLocale();

  return (
    <details className={`${TEXT_INSET} group`}>
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-[2px] text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-90"
        />
        {t.dashboard.viewAsTable}
      </summary>
      <Table className="mt-2">
        <TableCaption className="text-start">{t.dashboard.overviewTableCaption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{t.dashboard.month}</TableHead>
            {TABLE_METRICS.map((metric) => (
              <TableHead key={metric} scope="col" className="text-end">
                {SERIES[metric].label(t)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.monthStart}>
              <TableHead scope="row" className="font-normal text-muted-foreground">
                {overviewMonthLabel(row.monthStart, locale, "long")}
              </TableHead>
              {TABLE_METRICS.map((metric) => (
                <TableCell key={metric} className="text-end tabular-nums">
                  {SERIES[metric].format(row[metric], locale)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

export function Overview({ data }: { data: OverviewRow[] }) {
  const { t } = useLocale();

  if (!data.length) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative h-8 w-8 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t.dashboard.noData}</h3>
            <p className="text-sm text-muted-foreground">
              {t.dashboard.statsAppear}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const growthEmpty = isAllZero(data, GROWTH_METRICS);

  return (
    <div className="space-y-8">
      <p className={`${TEXT_INSET} text-xs text-muted-foreground`}>{t.dashboard.overviewPeriod}</p>

      <section aria-labelledby="overview-revenue-title" className="space-y-3">
        <h3 id="overview-revenue-title" className={`${TEXT_INSET} ${SUBHEADING}`}>
          {t.dashboard.revenueByMonth}
        </h3>
        {isAllZero(data, ["revenue"]) ? (
          <EmptyChart>{t.dashboard.noRevenueYet}</EmptyChart>
        ) : (
          <MetricChart
            data={data}
            metrics={["revenue"]}
            title={t.dashboard.revenueByMonth}
            maxBarSize={24}
            yAxis={{ width: 64, tickFormatter: revenueTick }}
          />
        )}
      </section>

      <section aria-labelledby="overview-growth-title" className="space-y-3">
        <div className={`${TEXT_INSET} flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2`}>
          <h3 id="overview-growth-title" className={SUBHEADING}>
            {t.dashboard.growthByMonth}
          </h3>
          {!growthEmpty && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {GROWTH_METRICS.map((metric) => (
                <li key={metric} className="flex items-center gap-1.5">
                  <Swatch metric={metric} />
                  {SERIES[metric].label(t)}
                </li>
              ))}
            </ul>
          )}
        </div>
        {growthEmpty ? (
          <EmptyChart>{t.dashboard.noGrowthYet}</EmptyChart>
        ) : (
          <MetricChart
            data={data}
            metrics={GROWTH_METRICS}
            title={t.dashboard.growthByMonth}
            maxBarSize={14}
            yAxis={{ width: 32, integer: true }}
          />
        )}
      </section>

      <OverviewTable data={data} />
    </div>
  );
}
