import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  const t = getServerMessages();
  const learningPaths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: { _count: { select: { courses: true, enrollments: true } } },
    orderBy: { position: "asc" },
  });

  return (
    <main className="container mx-auto space-y-8 px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t.public.learningPathsTitle}</h1>
        <p className="mt-4 text-muted-foreground">{t.public.pathsSubtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <Card key={path.id}>
            <CardHeader><CardTitle>{path.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-sm text-muted-foreground">{path.description || t.public.curatedPathDescription}</p>
              <p className="text-sm text-muted-foreground">{t.public.coursesCount(path._count.courses)} • {t.public.learnersCount(path._count.enrollments)}</p>
              <Button asChild className="w-full"><Link href={`/learning-paths/${path.slug}`}>{t.public.viewPath}</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
