import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, Route, StickyNote, LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

const StudentPage = async () => {
  const t = getServerMessages();
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const [user, courseEnrollments, learningPathEnrollments, upcomingSessions, notesCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.courseEnrollment.findMany({ where: { userId: session.user.id }, include: { course: true }, take: 3, orderBy: { updatedAt: "desc" } }),
    prisma.learningPathEnrollment.findMany({ where: { userId: session.user.id }, include: { learningPath: true }, take: 3, orderBy: { updatedAt: "desc" } }),
    prisma.liveSession.findMany({
      where: {
        startsAt: { gte: new Date() },
        OR: [
          { cohort: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
          { course: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
          { learningPath: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
        ],
      },
      take: 3,
      orderBy: { startsAt: "asc" },
    }),
    prisma.studentNote.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) return redirect("/");

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t.student.welcome(user.firstName || user.name || t.student.learnerFallback)}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{t.student.subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat title={t.student.enrolledCourses} value={courseEnrollments.length} icon={BookOpen} href="/student/courses" openLabel={t.common.open} />
          <DashboardStat title={t.student.learningPaths} value={learningPathEnrollments.length} icon={Route} href="/student/learning-paths" openLabel={t.common.open} />
          <DashboardStat title={t.student.upcomingSessions} value={upcomingSessions.length} icon={Calendar} href="/student/schedule" openLabel={t.common.open} />
          <DashboardStat title={t.student.notes} value={notesCount} icon={StickyNote} href="/student/notes" openLabel={t.common.open} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t.student.continueLearning}</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href="/student/courses">{t.common.viewAll}</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {courseEnrollments.map(({ course }) => (
                <div key={course.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.deliveryMode.replace("_", " ")}</p>
                  </div>
                  <Button asChild size="sm"><Link href={`/courses/${course.id}`}>{t.common.open}</Link></Button>
                </div>
              ))}
              {courseEnrollments.length === 0 && <p className="text-sm text-muted-foreground">{t.student.noCourses}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t.student.upcomingLiveSessions}</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href="/student/schedule">{t.nav.schedule}</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.map((liveSession) => (
                <div key={liveSession.id} className="rounded-lg border p-3">
                  <p className="font-medium">{liveSession.title}</p>
                  <p className="text-xs text-muted-foreground">{liveSession.startsAt.toLocaleString()}</p>
                </div>
              ))}
              {upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground">{t.student.noUpcomingSessions}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

function DashboardStat({ title, value, icon: Icon, href, openLabel }: { title: string; value: number; icon: LucideIcon; href: string; openLabel: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <Button asChild variant="link" className="h-auto p-0 text-xs"><Link href={href}>{openLabel}</Link></Button>
      </CardContent>
    </Card>
  );
}

export default StudentPage;
