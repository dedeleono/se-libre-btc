import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function StudentLearningPathsPage() {
  const session = await auth();
  const t = getServerMessages();
  const enrollments = session?.user?.id
    ? await prisma.learningPathEnrollment.findMany({
        where: { userId: session.user.id },
        include: { learningPath: { include: { _count: { select: { courses: true } } } } },
        orderBy: { enrolledAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.student.learningPaths}</h1>
        <p className="text-sm text-muted-foreground">{t.student.guidedCurricula}</p>
      </div>
      <div className="grid gap-4">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id}>
            <CardHeader><CardTitle>{enrollment.learningPath.title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t.public.coursesCount(enrollment.learningPath._count.courses)} • {enrollment.status.toLowerCase()}
            </CardContent>
          </Card>
        ))}
        {enrollments.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t.student.notEnrolledInPath}</CardContent></Card>}
      </div>
    </div>
  );
}
