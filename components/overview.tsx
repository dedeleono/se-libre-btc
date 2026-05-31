"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { OverviewData } from "@/actions/get-overview-data";
import { useLocale } from "@/lib/i18n";

interface OverviewProps {
  data: OverviewData[];
}

export function Overview({ data }: OverviewProps) {
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

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t.dashboard.revenue}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {formatPrice((payload[0]?.value as number) ?? 0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t.dashboard.students}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {(payload[1]?.value as number) ?? 0}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t.dashboard.courses}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {(payload[2]?.value as number) ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            strokeWidth={2}
            name={t.dashboard.revenue}
          />
          <Line
            type="monotone"
            dataKey="students"
            stroke="#82ca9d"
            strokeWidth={2}
            name={t.dashboard.newStudents}
          />
          <Line
            type="monotone"
            dataKey="courses"
            stroke="#ffc658"
            strokeWidth={2}
            name={t.dashboard.newCourses}
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
