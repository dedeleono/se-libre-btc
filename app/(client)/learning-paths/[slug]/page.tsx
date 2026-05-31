import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentButton } from "@/components/enrollment-button";
import { prisma } from "@/lib/db";

export default async function LearningPathDetailPage({ params }: { params: { slug: string } }) {
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
    <main className="container mx-auto space-y-8 px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{learningPath.title}</h1>
        {learningPath.description && <p className="mt-4 text-muted-foreground">{learningPath.description}</p>}
        <EnrollmentButton
          productId={learningPath.id}
          productType="learningPath"
          redirectTo={learningPath.courses[0]?.courseId ? `/courses/${learningPath.courses[0].courseId}` : "/student/learning-paths"}
          className="mt-6"
        >
          Enroll for free
        </EnrollmentButton>
      </div>
      <div className="grid gap-4">
        {learningPath.courses.map(({ course }, index) => (
          <Card key={course.id}>
            <CardHeader><CardTitle>{index + 1}. {course.title}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>{course.shortDescription || "Course details coming soon."}</span>
              <Button asChild variant="outline" size="sm"><Link href={`/courses/preview/${course.id}`}>Preview</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
