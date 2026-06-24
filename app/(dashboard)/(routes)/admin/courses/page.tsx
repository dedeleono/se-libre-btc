import Link from "next/link";
import { BookOpen, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export const revalidate = 0;

export default async function CoursesPage() {
  const t = getServerMessages();
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border bg-emerald-500/10 p-3">
              <BookOpen className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">{t.nav.courses}</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {t.admin.manageCatalog}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t.admin.newCourse}
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {course.shortDescription || t.admin.noShortDescription}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/courses/${course.id}`}>{t.admin.manage}</Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                <div>{t.admin.status}: {course.isPublished ? t.common.published : t.common.draft}</div>
                <div>{t.admin.difficulty}: {course.difficulty}</div>
                <div className="tabular-nums">{t.admin.modules}: {course._count.modules}</div>
                <div className="tabular-nums">{t.admin.enrollments}: {course._count.enrollments}</div>
              </CardContent>
            </Card>
          ))}

          {courses.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {t.admin.noCoursesYet}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
