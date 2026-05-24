import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentCoursesView } from "./_components/student-courses-view";
import { withTransaction } from "@/lib/db/transaction";
import DatabaseErrorBoundary from "@/components/database-error-boundary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import { StudentCoursesTable } from "./_components/student-courses-table";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function syncStudentLevelCourses(studentId: string, levelId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get all courses assigned to the level
      const levelCourses = await tx.levelCourse.findMany({
        where: { levelId },
        select: { courseId: true },
      });

      // 2. Create StudentCourse entries for any missing courses
      const createPromises = levelCourses.map((lc) =>
        tx.studentCourse.upsert({
          where: {
            studentId_courseId: {
              studentId: studentId,
              courseId: lc.courseId,
            },
          },
          create: {
            studentId: studentId,
            courseId: lc.courseId,
            isAssignedByLevel: true,
          },
          update: {
            isAssignedByLevel: true,
          },
        })
      );

      await Promise.all(createPromises);
    });
  } catch (error) {
    console.error("Error syncing student level courses:", error);
  }
}

export default async function StudentCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/sign-in");
  }

  return (
    <ScrollArea className="h-full">
      <DatabaseErrorBoundary>
        <Suspense fallback={<CoursesLoadingSkeleton />}>
          <StudentCoursesContent userEmail={session.user.email!} />
        </Suspense>
      </DatabaseErrorBoundary>
    </ScrollArea>
  );
}

async function StudentCoursesContent({ userEmail }: { userEmail: string }) {
  const studentData = await withTransaction(async (tx) => {
    const student = await tx.user.findUnique({
      where: {
        email: userEmail,
      },
      include: {
        studentLevel: {
          select: {
            id: true,
            name: true,
            price: true,
            inscriptionPrice: true,
            inscriptionPaid: true,
          }
        },
        studentCourses: {
          include: {
            course: {
              include: {
                teacher: true,
                modules: {
                  include: {
                    chapters: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (student?.studentLevel?.id) {
      await syncStudentLevelCourses(student.id, student.studentLevel.id);
    }

    return student;
  }, {
    timeout: 15000,
    maxWait: 20000,
  });

  if (!studentData) {
    return redirect("/");
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <StudentCoursesView
        level={{
          id: studentData?.studentLevel?.id || "",
          name: studentData?.studentLevel?.name || "",
          price: studentData?.studentLevel?.price || null,
          inscriptionPrice: studentData?.studentLevel?.inscriptionPrice || null,
          inscriptionPaid: studentData?.studentLevel?.inscriptionPaid || false,
        }}
        courses={studentData?.studentCourses || []}
      />
    </div>
  );
}

function CoursesLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-lg p-4 space-y-4 border shadow-sm"
          >
            <div className="aspect-video bg-muted animate-pulse rounded-md" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
