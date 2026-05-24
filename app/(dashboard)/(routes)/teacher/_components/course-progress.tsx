'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCachedCoursesActivity } from "@/lib/actions";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import { CourseProgressSkeleton } from "./course-progress-skeleton";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { ChartCourseData, CourseData, Module, TooltipProps } from "@/types/course-progress";

interface CourseProgressProps {
  initialData: CourseData[];
}

const CustomTooltip: RechartsPrimitive.TooltipProps<number, string>['content'] = (props) => {
  if (!props.active || !props.payload?.length) return null;
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-foreground">
          {props.payload[0].payload.moduleTitle}
        </p>
        <div className="flex justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Completado:
          </span>
          <span className="text-sm font-medium text-foreground">
            {props.payload[0].value}%
          </span>
        </div>
      </div>
    </div>
  );
};

export function CourseProgress({ initialData }: CourseProgressProps) {
  if (!initialData) {
    return <CourseProgressSkeleton />;
  }

  const processedCourseActivity = initialData.map(course => ({
    ...course,
    moduleProgress: course.modules.map(module => ({
      moduleTitle: module.title,
      totalStudents: course.totalStudents,
      completedStudents: module.chapters.reduce(
        (acc, chapter) => acc + chapter.studentProgress.filter(p => p.isCompleted).length,
        0
      ),
      completionRate: calculateModuleCompletionRate(module, course.totalStudents)
    }))
  })) as ChartCourseData[];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
        <h3 className="font-semibold text-lg">Progreso de Cursos</h3>
        <p className="text-sm text-muted-foreground sm:block hidden">
          Seguimiento del avance por módulo
        </p>
      </div>

      <div className="flex-1 p-3 sm:p-4 lg:p-6 grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 auto-rows-fr overflow-y-auto">
        {processedCourseActivity.slice(0, 4).map((course) => (
          <Card
            key={course.courseId}
            className="transition-all duration-300 hover:shadow-md"
          >
            <CardHeader className="space-y-2 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl font-semibold line-clamp-1">
                    {course.title}
                  </CardTitle>
                  <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">{course.level?.name || "Sin nivel asignado"}</span>
                  </div>
                </div>
                {/* <div className="flex sm:flex-col items-center sm:items-end gap-x-2 sm:gap-y-1">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Progreso General
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {course.completionRate}%
                  </span>
                </div> */}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-2">
              <div className="h-[160px] sm:h-[180px] lg:h-[200px] w-full">
                <ChartContainer
                  config={{
                    completionRate: {
                      label: "Tasa de finalización",
                      color: "hsl(var(--primary))",
                    },
                  }}
                >
                  <RechartsPrimitive.ResponsiveContainer>
                    <RechartsPrimitive.BarChart
                      data={course.moduleProgress}
                      margin={{ top: 10, right: 5, left: -20, bottom: 20 }}
                    >
                      <RechartsPrimitive.XAxis
                        dataKey="moduleTitle"
                        stroke="currentColor"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={(props) => {
                          const { x, y, payload } = props;
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text
                                x={0}
                                y={0}
                                dy={16}
                                textAnchor="middle"
                                fill="currentColor"
                                fontSize={11}
                                
                              >
                                {payload.value.length > 10
                                  ? `${payload.value.substring(0, 10)}...`
                                  : payload.value}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <RechartsPrimitive.YAxis
                        stroke="currentColor"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsPrimitive.Bar
                        dataKey="completionRate"
                        fill="currentColor"
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      />
                      <RechartsPrimitive.Tooltip content={CustomTooltip} />
                    </RechartsPrimitive.BarChart>
                  </RechartsPrimitive.ResponsiveContainer>
                </ChartContainer>
              </div>
              
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function calculateModuleCompletionRate(module: Module, totalStudents: number): number {
  const totalPossibleCompletions = totalStudents * module.chapters.length;
  const completedChapters = module.chapters.reduce(
    (acc, chapter) => acc + chapter.studentProgress.filter(p => p.isCompleted).length,
    0
  );
  
  return totalPossibleCompletions > 0
    ? Math.round((completedChapters / totalPossibleCompletions) * 100)
    : 0;
} 