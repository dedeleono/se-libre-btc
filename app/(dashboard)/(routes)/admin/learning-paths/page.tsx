import Link from "next/link";
import { Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function AdminLearningPathsPage() {
  const t = getServerMessages();
  const learningPaths = await prisma.learningPath.findMany({
    include: { _count: { select: { courses: true, enrollments: true } } },
    orderBy: { position: "asc" },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border bg-primary/10 p-3">
            <Route className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.nav.learningPaths}</h1>
            <p className="text-sm text-muted-foreground">{t.admin.bundleCourses}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/learning-paths/new">{t.admin.newPath}</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {learningPaths.map((path) => (
          <Card key={path.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{path.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{path.description || t.admin.noDescriptionYet}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/learning-paths/${path.slug}`}>{t.public.preview}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/learning-paths/${path.id}`}>{t.admin.manage}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div>{t.admin.status}: {path.isPublished ? t.common.published : t.common.draft}</div>
              <div>{t.nav.courses}: {path._count.courses}</div>
              <div>{t.admin.enrollments}: {path._count.enrollments}</div>
            </CardContent>
          </Card>
        ))}
        {learningPaths.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t.admin.noLearningPathsYet}</CardContent></Card>}
      </div>
    </div>
  );
}
