import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  const learningPaths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: { _count: { select: { courses: true, enrollments: true } } },
    orderBy: { position: "asc" },
  });

  return (
    <main className="container mx-auto space-y-8 px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Bitcoin Learning Paths</h1>
        <p className="mt-4 text-muted-foreground">Structured paths for self-paced and cohort-based Bitcoin education.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <Card key={path.id}>
            <CardHeader><CardTitle>{path.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-sm text-muted-foreground">{path.description || "A curated Bitcoin education path."}</p>
              <p className="text-sm text-muted-foreground">{path._count.courses} courses • {path._count.enrollments} learners</p>
              <Button asChild className="w-full"><Link href={`/learning-paths/${path.slug}`}>View path</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
