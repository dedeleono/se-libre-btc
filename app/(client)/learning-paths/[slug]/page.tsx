import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnrollmentButton } from "@/components/enrollment-button";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function LearningPathDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const t = getServerMessages();
  const learningPath = await prisma.learningPath.findUnique({
    where: { slug: params.slug },
    include: {
      courses: {
        include: { course: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!learningPath || !learningPath.isPublished) {
    notFound();
  }

  return (
    <main className="dl-app mx-auto max-w-[1160px] space-y-10 px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <div className="page-eyebrow">{t.public.learningPathsTitle}</div>
        <h1 className="page-title mt-4">{learningPath.title}</h1>
        {learningPath.description && <p className="mt-4 text-lg font-semibold text-muted-foreground">{learningPath.description}</p>}
        <EnrollmentButton
          productId={learningPath.id}
          productType="learningPath"
          redirectTo={learningPath.courses[0]?.courseId ? `/courses/${learningPath.courses[0].courseId}` : "/student/learning-paths"}
          className="mt-8"
        >
          {t.course.enrollForFree}
        </EnrollmentButton>
      </div>
      <div className="grid gap-4">
        {learningPath.courses.map(({ course }, index) => (
          <article key={course.id} className="stamp-card grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="grid h-12 w-12 place-items-center border-2 border-foreground bg-primary font-[var(--font-display)] text-2xl text-primary-foreground">
              {index + 1}
            </div>
            <div>
              <h2 className="text-2xl">{course.title}</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{course.shortDescription || t.public.courseDetailsComingSoon}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/preview/${course.id}`}>
                <BookOpen className="h-4 w-4" />
                {t.public.preview}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </main>
  );
}
