import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <main className="dl-app mx-auto max-w-[1160px] space-y-10 px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <div className="page-eyebrow">Rutas</div>
        <h1 className="page-title mt-4">{t.public.learningPathsTitle}</h1>
        <p className="mt-4 max-w-xl text-lg font-semibold text-muted-foreground">{t.public.pathsSubtitle}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <article key={path.id} className="stamp-card flex min-h-[280px] flex-col p-6">
            <Map className="mb-8 h-8 w-8 text-[var(--terracota-500)] dark:text-[var(--maiz-500)]" />
            <h2 className="text-3xl">{path.title}</h2>
            <p className="mt-4 line-clamp-4 text-sm font-semibold leading-relaxed text-muted-foreground">{path.description || t.public.curatedPathDescription}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t.public.coursesCount(path._count.courses)} / {t.public.learnersCount(path._count.enrollments)}
            </p>
            <Button asChild className="mt-auto w-full">
              <Link href={`/learning-paths/${path.slug}`}>
                {t.public.viewPath}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </main>
  );
}
