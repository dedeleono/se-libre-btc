import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentSchedulePage() {
  const session = await auth();
  const liveSessions = session?.user?.id
    ? await prisma.liveSession.findMany({
        where: {
          startsAt: { gte: new Date() },
          OR: [
            { cohort: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
            { course: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
            { learningPath: { enrollments: { some: { userId: session.user.id, status: "ACTIVE" } } } },
          ],
        },
        orderBy: { startsAt: "asc" },
      })
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground">Upcoming live sessions from your cohorts and courses.</p>
      </div>
      <div className="grid gap-4">
        {liveSessions.map((session) => (
          <Card key={session.id}>
            <CardHeader><CardTitle>{session.title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{session.startsAt.toLocaleString()}</CardContent>
          </Card>
        ))}
        {liveSessions.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No upcoming live sessions.</CardContent></Card>}
      </div>
    </div>
  );
}
