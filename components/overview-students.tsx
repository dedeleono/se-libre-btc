"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ProgressData {
  name: string;
  average: number;
}

interface OverviewStudentsProps {
  data: ProgressData[];
}

export function OverviewStudents({ data }: OverviewStudentsProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
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
          formatter={(value: number) => [`${value}%`, "Promedio"]}
          cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
        />
        <Bar
          dataKey="average"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
