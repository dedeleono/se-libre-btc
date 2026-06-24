import { Calendar } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function AdminCohortsPage() {
  const t = getServerMessages();
  const cohorts = await prisma.cohort.findMany({
    include: { course: true, learningPath: true, _count: { select: { enrollments: true, liveSessions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border bg-primary/10 p-3">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">{t.nav.cohorts}</h1>
            <p className="text-sm text-muted-foreground text-pretty">{t.admin.manageLiveHybrid}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/cohorts/new">{t.admin.newCohort}</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {cohorts.map((cohort) => (
          <Card key={cohort.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{cohort.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{cohort.course?.title || cohort.learningPath?.title || t.admin.noTargetSelected}</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/cohorts/${cohort.id}`}>{t.admin.manage}</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div>{t.admin.status}: {cohort.status}</div>
              <div className="tabular-nums">{t.admin.enrollments}: {cohort._count.enrollments}</div>
              <div className="tabular-nums">{t.admin.liveSessions}: {cohort._count.liveSessions}</div>
            </CardContent>
          </Card>
        ))}
        {cohorts.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t.admin.noCohortsYet}</CardContent></Card>}
      </div>
    </div>
  );
}
