"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Toggle } from "@/components/ui/toggle";
import { BarChart2, LineChart as LineChartIcon, TrendingUp } from "lucide-react";
import { useState } from "react";

interface ProgressOverviewProps {
  data: {
    name: string;
    average: number;
  }[];
  className?: string;
}

export const ProgressOverview = ({ data, className }: ProgressOverviewProps) => {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const hasData = data.some(item => item.average > 0);
  const currentAverage = data.length > 0 
    ? data[data.length - 1].average 
    : 0;
  const previousAverage = data.length > 1 
    ? data[data.length - 2].average 
    : 0;
  const trend = currentAverage - previousAverage;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                Promedio:
              </span>
              <span className="text-sm font-medium">
                {payload[0].value}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-primary dark:text-secondary font-['Open_Sans']">
            Progreso Mensual
          </CardTitle>
          {hasData && (
            <div className="flex items-center gap-2 md:text-sm text-xs text-muted-foreground">
              <TrendingUp
                className={`h-4 w-4 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}
              />
              <span>
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}% vs mes anterior
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Toggle
            pressed={chartType === "bar"}
            onPressedChange={() => setChartType("bar")}
            size="sm"
            aria-label="Toggle bar chart"
            
          >
            <BarChart2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={chartType === "line"}
            onPressedChange={() => setChartType("line")}
            size="sm"
            aria-label="Toggle line chart"
            
          >
            <LineChartIcon className="h-4 w-4" />
          </Toggle>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">
                No hay datos disponibles
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Los promedios mensuales aparecerán aquí cuando comiences a
                enviar tareas.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={data}>
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
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={CustomTooltip}
                    cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar
                    dataKey="average"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              ) : (
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
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 