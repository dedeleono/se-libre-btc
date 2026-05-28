import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, Route, StickyNote, LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const StudentPage = async () => {
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
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.firstName || user.name || "learner"}</h1>
          <p className="text-sm text-muted-foreground">Continue your Bitcoin education.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat title="Enrolled courses" value={courseEnrollments.length} icon={BookOpen} href="/student/courses" />
          <DashboardStat title="Learning paths" value={learningPathEnrollments.length} icon={Route} href="/student/learning-paths" />
          <DashboardStat title="Upcoming sessions" value={upcomingSessions.length} icon={Calendar} href="/student/schedule" />
          <DashboardStat title="Notes" value={notesCount} icon={StickyNote} href="/student/notes" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Continue learning</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href="/student/courses">View all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {courseEnrollments.map(({ course }) => (
                <div key={course.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.deliveryMode.replace("_", " ")}</p>
                  </div>
                  <Button asChild size="sm"><Link href={`/courses/${course.id}`}>Open</Link></Button>
                </div>
              ))}
              {courseEnrollments.length === 0 && <p className="text-sm text-muted-foreground">No courses yet. Browse the catalog to get started.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Upcoming live sessions</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href="/student/schedule">Schedule</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.map((liveSession) => (
                <div key={liveSession.id} className="rounded-lg border p-3">
                  <p className="font-medium">{liveSession.title}</p>
                  <p className="text-xs text-muted-foreground">{liveSession.startsAt.toLocaleString()}</p>
                </div>
              ))}
              {upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground">No upcoming sessions.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

function DashboardStat({ title, value, icon: Icon, href }: { title: string; value: number; icon: LucideIcon; href: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Button asChild variant="link" className="h-auto p-0 text-xs"><Link href={href}>Open</Link></Button>
      </CardContent>
    </Card>
  );
}

export default StudentPage;
