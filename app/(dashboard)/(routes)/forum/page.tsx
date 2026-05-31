import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ForumClient } from "./_components/forum-client";
import { ForumPost } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import { getServerMessages } from "@/lib/i18n-server";

type CourseWithPath = {
  id: string;
  title: string;
  learningPaths: {
    learningPathId: string;
  }[];
};

export default async function Forum() {
  const t = getServerMessages();
  const session = await auth();
  if (!session?.user) {
    return redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      learningPathEnrollments: {
        select: { learningPathId: true }
      },
      courseEnrollments: {
        select: { courseId: true }
      },
      cohortEnrollments: {
        select: { cohortId: true }
      }
    },
  });

  if (!user) {
    return redirect("/");
  }

  type PostWithRelations = ForumPost & {
    author: { id: string; name: string | null };
    learningPath: {
      id: string;
      title: string;
    } | null;
    cohort: {
      id: string;
      title: string;
    } | null;
    course: {
      id: string;
      title: string;
    } | null;
    comments: { id: string }[];
    _count: {
      comments: number;
      views: number;
    };
  };

  let posts: PostWithRelations[] = [];
  
  if (user.role === "ADMIN") {
    posts = await prisma.forumPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        learningPath: {
          select: { id: true, title: true }
        },
        cohort: {
          select: { id: true, title: true }
        },
        course: {
          select: {
            id: true,
            title: true,
          }
        },
        comments: {
          select: {
            id: true,
          }
        },
        _count: {
          select: {
            comments: true,
            views: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else {
    posts = await prisma.forumPost.findMany({
      where: {
        OR: [
          { learningPathId: { in: user.learningPathEnrollments.map((enrollment) => enrollment.learningPathId) } },
          { cohortId: { in: user.cohortEnrollments.map((enrollment) => enrollment.cohortId) } },
          { courseId: { in: user.courseEnrollments.map((enrollment) => enrollment.courseId) } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        learningPath: {
          select: { id: true, title: true }
        },
        cohort: {
          select: { id: true, title: true }
        },
        course: {
          select: {
            id: true,
            title: true,
          }
        },
        comments: {
          select: {
            id: true,
          }
        },
        _count: {
          select: {
            comments: true,
            views: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  let learningPaths: { id: string; name: string }[] = [];
  let cohorts: { id: string; name: string }[] = [];
  let courses: CourseWithPath[] = [];
  try {
    [learningPaths, courses, cohorts] = await Promise.all([
      prisma.learningPath.findMany({
        select: {
          id: true,
          title: true,
        }
      }).then((paths) => paths.map((path) => ({ id: path.id, name: path.title }))),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          learningPaths: {
            select: {
              learningPathId: true
            },
            take: 1
          }
        }
      }),
      prisma.cohort.findMany({
        select: {
          id: true,
          title: true,
        },
        orderBy: { title: "asc" },
      }).then((items) => items.map((cohort) => ({ id: cohort.id, name: cohort.title }))),
    ]);
  } catch (error) {
    console.error("Error fetching forum filters:", error);
  }

  const transformedCourses = courses.map((course: CourseWithPath) => ({
    id: course.id,
    title: course.title,
    learningPathId: course.learningPaths[0]?.learningPathId || null
  }));

  const canCreatePosts = user.role === "ADMIN";

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="flex items-start gap-3 md:gap-4">
          <div
            className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 
            dark:from-accent/30 dark:via-accent/20 dark:to-transparent dark:border-white/[0.05] 
            dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
          >
            <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-accent dark:text-white/90" />
          </div>
          <div>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
              bg-gradient-to-r from-accent to-primary dark:from-white dark:to-white/50 bg-clip-text text-transparent
              font-['Open_Sans']"
            >
              {t.forum.title}
            </h2>
            <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
              {t.forum.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div
        className="bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
        dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
        dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
      >
        <div className="p-4 sm:p-6 bg-card rounded-xl">
          <ForumClient
            posts={posts}
            currentUser={user}
            learningPaths={learningPaths}
            cohorts={cohorts}
            courses={transformedCourses}
            canCreatePosts={canCreatePosts}
          />
        </div>
      </div>
    </div>
  );
}
