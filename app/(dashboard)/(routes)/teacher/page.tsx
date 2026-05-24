import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import DatabaseErrorBoundary from "@/components/database-error-boundary";
import { redirect } from "next/navigation";
import { RecentSubmissions } from "./_components/recent-submissions";
import { cache } from "react";
import { StatsCards } from "./_components/stats-cards";
import { TransactionManager } from "@/lib/db/transaction-manager";
import { calculateCompletionRate } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { CourseProgress } from "./_components/course-progress";
import { CourseProgressWrapper } from "./_components/course-progress-wrapper";

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = "force-dynamic";

interface DashboardData {
  activeCourses: number;
  totalStudents: number;
  pendingReviews: number;
}

interface CourseActivity {
  courseId: string;
  title: string;
  totalStudents: number;
  completionRate: number;
  activeStudents: number;
  level?: {
    name: string;
  } | null;
}

interface DashboardAggregateData {
  totalStudents: number;
  activeCourses: number;
  pendingReviews: number;
}

interface CourseModule {
  id: string;
  title: string;
  chapters: {
    id: string;
    studentProgress: {
      isCompleted: boolean;
      userId: string;
    }[];
  }[];
}

interface CourseWithRelations {
  id: string;
  title: string;
  level?: {
    name: string;
  } | null;
  modules: CourseModule[];
  studentCourses?: {
    studentId: string;
  }[];
}

const transactionManager = TransactionManager.getInstance();

async function getDashboardData(teacherId: string): Promise<DashboardData> {
  return transactionManager.executeQuery(async () => {
    const [aggregateData] = await prisma.$transaction(
      [
        prisma.$queryRaw<DashboardAggregateData[]>`
        WITH TeacherCourses AS (
          SELECT DISTINCT c.id
          FROM "Course" c
          LEFT JOIN "LevelCourse" lc ON c."id" = lc."courseId"
          LEFT JOIN "LevelTeacher" tl ON lc."levelId" = tl."levelId"
          WHERE c."teacherId" = ${teacherId}
          OR tl."teacherId" = ${teacherId}
        )
        SELECT
          (SELECT COUNT(DISTINCT u.id)
           FROM "User" u
           LEFT JOIN "StudentCourse" sc ON u.id = sc."studentId"
           JOIN TeacherCourses tc ON sc."courseId" = tc.id
           JOIN "LevelTeacher" tl ON u."levelId" = tl."levelId"
           WHERE u.role = 'STUDENT'
           AND (tc.id IS NOT NULL OR tl."teacherId" = ${teacherId})
          ) as "totalStudents",
          
          (SELECT COUNT(*) FROM TeacherCourses) as "activeCourses",
          
          (SELECT COUNT(*)
           FROM "Submission" s
           JOIN "Assignment" a ON s."assignmentId" = a.id
           JOIN "Chapter" ch ON a."chapterId" = ch.id
           JOIN "CourseModule" m ON ch."moduleId" = m.id
           JOIN TeacherCourses tc ON m."courseId" = tc.id
           WHERE s.status = 'SUBMITTED'
           AND s.score IS NULL
          ) as "pendingReviews"
      `,
      ],
      {
        isolationLevel: "ReadCommitted",
      }
    );

    return (
      aggregateData[0] || {
        totalStudents: 0,
        activeCourses: 0,
        pendingReviews: 0,
      }
    );
  });
}

async function getCoursesActivity(teacherId: string): Promise<CourseActivity[]> {
  return transactionManager.executeQuery(async () => {
    try {
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            { teacherId },
            {
              levelCourses: {
                some: {
                  level: {
                    teacherLevels: {
                      some: { teacherId },
                    },
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          levelCourses: {
            select: {
              level: {
                select: {
                  name: true,
                },
              },
            },
          },
          modules: {
            select: {
              id: true,
              title: true,
              chapters: {
                select: {
                  id: true,
                  studentProgress: {
                    select: {
                      isCompleted: true,
                      userId: true,
                    },
                  },
                },
              },
            },
          },
          studentCourses: {
            select: {
              studentId: true,
            },
          },
        },
      }) as unknown as CourseWithRelations[];

      if (!courses?.length) {
        return [];
      }

      const courseActivities = await Promise.all(courses.map(async (course) => ({
        courseId: course.id,
        title: course.title,
        level: course.level,
        totalStudents: course.studentCourses?.length ?? 0,
        completionRate: await calculateCompletionRate(course.modules),
        activeStudents: course.studentCourses?.length ?? 0,
      })));

      return courseActivities;
    } catch (error) {
      console.error("Error fetching course activity:", error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to fetch course activity");
    }
  });
}

const getCachedDashboardData = cache(getDashboardData);
const getCachedCoursesActivity = cache(getCoursesActivity);

export default async function TeacherPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  return (
    <DatabaseErrorBoundary>
      <TeacherDashboardContent
        userId={session.user.id}
        userName={session.user.name}
      />
    </DatabaseErrorBoundary>
  );
}

async function TeacherDashboardContent({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null | undefined;
}) {
  try {
    const [dashboardData, courseActivity] = await Promise.all([
      getCachedDashboardData(userId),
      getCachedCoursesActivity(userId),
    ]);

    if (!dashboardData) {
      throw new Error("Failed to load dashboard data");
    }

    return (
      <div className="h-full p-6 space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b">
            <div>
              <TabsContent value="overview" className="m-0">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-gradient font-['Open_Sans']">
                    Bienvenido{userName ? `, ${userName}` : ""} 👋
                  </h2>
                  <p className="text-muted-foreground/80 sm:block hidden text-xs">
                    Aquí está lo que está sucediendo con tus cursos hoy
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="my-courses" className="m-0">
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Tus Cursos
                  </h2>
                  <p className="text-muted-foreground">
                    Administra y supervisa tus cursos
                  </p>
                </div>
              </TabsContent>
            </div>

            {/* <TabsList className="mt-4 sm:mt-0">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="my-courses">Mis Cursos</TabsTrigger>
            </TabsList> */}
          </div>

          <TabsContent value="overview" className="space-y-8">
            <StatsCards userId={userId} />

            <div className="grid gap-6 lg:grid-cols-7 min-h-[600px]">
              <div className="lg:col-span-4 h-full">
                <div className="h-full rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                  <CourseProgressWrapper userId={userId} />
                </div>
              </div>

              <div className="lg:col-span-3 h-full">
                <div className="h-full rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                  <RecentSubmissions teacherId={userId} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* <TabsContent value="my-courses" className="space-y-6">
            {courses.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="mt-6 text-xl font-semibold">
                    No hay cursos creados
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Aún no has creado ningún curso. Comienza creando tu primer
                    curso para comenzar a enseñar.
                  </p>
                  <Link href="/teacher/create" className="mt-4">
                    <Button size="lg" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Crear tu primer curso
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <CoursesTable 
                initialData={{
                  data: courses,
                  metadata: {
                    total: courses.length,
                    currentPage: 1,
                    totalPages: 1,
                    hasMore: false
                  }
                }}
                onPageChange={async (newPage) => {
                  "use server";
                  redirect(`/teacher?page=${newPage}`);
                }}
              />
            )}
          </TabsContent> */}
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
        <p className="text-muted-foreground text-lg">
          {error instanceof Error ? error.message : "Error loading dashboard"}
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          type="button"
        >
          Try Again
        </Button>
      </div>
    );
  }
}

export async function generateMetadata() {
  return {
    other: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59",
    },
  };
}
