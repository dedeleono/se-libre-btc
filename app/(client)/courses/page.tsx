import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="container mx-auto space-y-8 px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t.public.coursesTitle}</h1>
        <p className="mt-4 text-muted-foreground">{t.public.coursesSubtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader><CardTitle>{course.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-sm text-muted-foreground">{course.shortDescription || course.description || t.public.courseDetailsComingSoon}</p>
              <Button asChild className="w-full"><Link href={`/courses/preview/${course.id}`}>{t.public.viewCourse}</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
