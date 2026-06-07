import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function PublicCoursesPage() {
  const t = getServerMessages();
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="dl-app mx-auto max-w-[1160px] space-y-10 px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <div className="page-eyebrow">Lecciones</div>
        <h1 className="page-title mt-4">{t.public.coursesTitle}</h1>
        <p className="mt-4 max-w-xl text-lg font-semibold text-muted-foreground">{t.public.coursesSubtitle}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="stamp-card flex min-h-[260px] flex-col p-6">
            <BookOpen className="mb-8 h-8 w-8 text-[var(--terracota-500)] dark:text-[var(--maiz-500)]" />
            <h2 className="text-3xl">{course.title}</h2>
            <p className="mt-4 line-clamp-4 text-sm font-semibold leading-relaxed text-muted-foreground">
              {course.shortDescription || course.description || t.public.courseDetailsComingSoon}
            </p>
            <Button asChild className="mt-auto w-full">
              <Link href={`/courses/preview/${course.id}`}>
                {t.public.viewCourse}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </main>
  );
}
