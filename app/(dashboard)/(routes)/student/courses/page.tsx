import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function StudentCoursesPage() {
  const session = await auth();
  const t = getServerMessages();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { position: "asc" },
            include: {
              chapters: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
  });

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t.nav.myLearning}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{t.student.myLearningSubtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const totalChapters = course.modules.reduce((total, module) => total + module.chapters.length, 0);
            // First published chapter in (module.position, chapter.position)
            // order — link straight to it to skip the /courses/[id] redirect hop.
            const firstChapterId = course.modules.flatMap((module) => module.chapters)[0]?.id;
            const continueHref = firstChapterId
              ? `/courses/${course.id}/chapters/${firstChapterId}`
              : `/courses/${course.id}`;

            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{course.shortDescription || t.student.continueLearningFallback}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">{t.student.publishedChaptersCount(totalChapters)}</div>
                  <Button asChild className="w-full">
                    <Link href={continueHref}>{t.common.continue}</Link>
                  </Button>
                  {enrollment.completedAt && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/courses/${course.id}/complete`}>{t.completion.certificateSectionTitle}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {enrollments.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="space-y-4 p-8 text-center">
                <p className="text-sm text-muted-foreground">{t.student.noEnrolledCourses}</p>
                <Button asChild>
                  <Link href="/student/browse">{t.nav.browseCourses}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
