import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, PlayCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function StudentSchedulePage() {
  const session = await auth();
  const t = getServerMessages();
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
        <h1 className="text-3xl font-bold tracking-tight text-balance">{t.nav.schedule}</h1>
        <p className="text-sm text-muted-foreground text-pretty">{t.student.scheduleSubtitle}</p>
      </div>
      <div className="grid gap-4">
        {liveSessions.map((liveSession) => {
          const isLive = liveSession.status === "LIVE";
          const start = liveSession.startsAt.toLocaleString();
          const end = liveSession.endsAt?.toLocaleString();
          return (
            <Card key={liveSession.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{liveSession.title}</CardTitle>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 border-2 border-foreground bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-primary-foreground">
                      {t.student.sessionLive}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="font-semibold tabular-nums">
                  {end ? t.student.sessionTimeRange(start, end) : start}
                </div>
                {liveSession.description && liveSession.description.trim() && (
                  <p>{liveSession.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {liveSession.meetingUrl &&
                    (liveSession.status === "SCHEDULED" || liveSession.status === "LIVE") && (
                      <Button asChild size="sm">
                        <a href={liveSession.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-4 w-4" />
                          {t.student.joinMeeting}
                        </a>
                      </Button>
                    )}
                  {liveSession.recordingUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={liveSession.recordingUrl} target="_blank" rel="noopener noreferrer">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {t.student.watchRecording}
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {liveSessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t.student.noUpcomingSessions}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
