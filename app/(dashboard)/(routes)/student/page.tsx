import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, GraduationCap, Clock, Target } from "lucide-react";
import StatsCard from "./_components/stats-card";
import { ProgressOverview } from "./_components/progress-overview";
import { RecentSubmissionsCard } from "./_components/recent-submissions-card";
import { getStudentScoresData, calculateMonthlyProgress } from "@/lib/student-scores";

const StudentPage = async () => {
  const session = await auth();
  if (!session?.user) return redirect("/");

  const dbUser = await prisma.user.findUnique({ 
    where: { email: session.user.email! }
  });
  if (!dbUser) return redirect("/");
  
  const studentScores = await getStudentScoresData(dbUser.id);
  if (!studentScores) return redirect("/");
  
  const { studentData, metrics } = studentScores;
  const { activeCourses, submittedAssignments, totalSubmittedAssignments, averageScore } = metrics;

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
              dark:from-secondary/30 dark:via-secondary/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
            >
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-secondary/90" />
            </div>
            <div>
              <h2
                className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                 font-['Open_Sans']"
              >
                <span
                  className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70"
                >
                  Bienvenido, {studentData.firstName || studentData.name}
                </span>{" "}
                👋
              </h2>
              <p className="text-xs dark:text-white/50 font-['Open_Sans']">
                {studentData.studentLevel
                  ? `Nivel actual: ${studentData.studentLevel.name}`
                  : "Sin nivel asignado"}
              </p>
            </div>
          </div>
          <CalendarDateRangePicker />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Cursos Activos"
            value={activeCourses}
            description="Cursos en progreso"
            icon={BookOpen}
            trend="neutral"
            className="bg-gradient-to-br from-card/50 to-card dark:from-black/40 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              transition-all duration-300"
          />

          <StatsCard
            title="Por Calificar"
            value={submittedAssignments}
            description="En espera de revisión"
            icon={Clock}
            trend="neutral"
            className="bg-gradient-to-br from-card/50 to-card dark:from-black/40 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              transition-all duration-300"
          />

          <StatsCard
            title="Total Enviadas"
            value={totalSubmittedAssignments}
            description="Tareas completadas"
            icon={GraduationCap}
            trend="positive"
            className="bg-gradient-to-br from-card/50 to-card dark:from-black/40 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              transition-all duration-300"
          />

          <StatsCard
            title="Promedio General"
            value={
              <div className="flex items-baseline gap-1">
                <span>{averageScore.toFixed(1)}</span>
                <span className="text-sm text-foreground/80">/ 100</span>
              </div>
            }
            description="Calificación actual"
            icon={Target}
            trend={averageScore >= 70 ? "positive" : "negative"}
            className="bg-gradient-to-br from-card/50 to-card dark:from-black/40 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              transition-all duration-300"
          />
        </div>

        {/* Progress and Recent Submissions */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-7">
          <ProgressOverview
            data={calculateMonthlyProgress(studentData.assignmentScores)}
            className="col-span-1 sm:col-span-4 bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
              dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
              dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          />

          <RecentSubmissionsCard
            scores={studentData.assignmentScores}
            className="col-span-1 sm:col-span-3 bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
              dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
              dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          />
        </div>
      </div>
    </ScrollArea>
  );
};

export default StudentPage;
