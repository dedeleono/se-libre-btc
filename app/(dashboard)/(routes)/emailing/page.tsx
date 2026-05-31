import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailingForm } from "./_components/emailing-form";
import { prisma } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GradientDivider } from "@/components/gradient-divider";
import { QuickActions } from "./_components/quick-actions";
import { Mail, Sparkles } from "lucide-react";
import { getServerMessages } from "@/lib/i18n-server";

export default async function EmailingPage() {
  const t = getServerMessages();
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isDeleted: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      courseEnrollments: {
        select: {
          courseId: true,
          course: {
            select: {
              title: true,
            }
          }
        }
      },
      learningPathEnrollments: {
        select: {
          learningPathId: true,
          learningPath: {
            select: {
              title: true,
            }
          }
        }
      },
      cohortEnrollments: {
        select: {
          cohortId: true,
          cohort: {
            select: {
              title: true,
            }
          }
        }
      },
    }
  });

  const [courses, learningPaths, cohorts] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.learningPath.findMany({ select: { id: true, title: true, position: true }, orderBy: { position: "asc" } }),
    prisma.cohort.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70 font-['Open_Sans']">
                {t.emailing.title}
              </h2>
              <p className="text-xs dark:text-white/50 font-['Open_Sans']">
                {t.emailing.subtitle}
              </p>
            </div>
          </div>
          
        </div>

        <GradientDivider className="my-4 md:my-6 dark:opacity-20" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-5">
            <div className="bg-card rounded-xl shadow-lg dark:border-white/[0.05] 
              dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              dark:hover:shadow-[0_8px_32px_rgba(3,65,127,0.25)] transition-all duration-300">
              <div className="p-4 sm:p-6">
                <EmailingForm
                  students={students}
                  groups={[
                    ...learningPaths.map((path) => ({
                      id: `learning-path:${path.id}`,
                      name: path.title,
                      position: path.position,
                      studentEmails: students
                        .filter((student) => student.learningPathEnrollments.some((enrollment) => enrollment.learningPathId === path.id))
                        .map((student) => student.email),
                    })),
                    ...courses.map((course, index) => ({
                      id: `course:${course.id}`,
                      name: course.title,
                      position: 1000 + index,
                      studentEmails: students
                        .filter((student) => student.courseEnrollments.some((enrollment) => enrollment.courseId === course.id))
                        .map((student) => student.email),
                    })),
                    ...cohorts.map((cohort, index) => ({
                      id: `cohort:${cohort.id}`,
                      name: cohort.title,
                      position: 2000 + index,
                      studentEmails: students
                        .filter((student) => student.cohortEnrollments.some((enrollment) => enrollment.cohortId === cohort.id))
                        .map((student) => student.email),
                    })),
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
