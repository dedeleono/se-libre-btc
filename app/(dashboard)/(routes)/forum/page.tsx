import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ForumClient } from "./_components/forum-client";
import { ForumPost, Level, Course } from "@prisma/client";
import { MessageSquare } from "lucide-react";

type CourseWithLevel = {
  id: string;
  title: string;
  levelCourses: {
    levelId: string;
  }[];
};

export default async function Forum() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      studentLevel: {
        select: {
          id: true,
          name: true,
          position: true,
        }
      },
      studentCourses: {
        select: {
          courseId: true
        }
      }
    },
  });

  if (!user) {
    return redirect("/");
  }

  type PostWithRelations = ForumPost & {
    author: { id: string; name: string | null };
    level: {
      id: string;
      name: string;
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
  
  if (user.role === "ADMIN" || user.role === "TEACHER") {
    posts = await prisma.forumPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        level: {
          select: {
            id: true,
            name: true,
          }
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
          { levelId: user.studentLevel?.id },
          {
            courseId: {
              in: user.studentCourses.map((sc) => sc.courseId),
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        level: {
          select: {
            id: true,
            name: true,
          }
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

  let levels: { id: string; name: string }[] = [];
  let courses: CourseWithLevel[] = [];
  try {
    [levels, courses] = await Promise.all([
      prisma.level.findMany({
        select: {
          id: true,
          name: true,
        }
      }),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          levelCourses: {
            select: {
              levelId: true
            },
            take: 1
          }
        }
      }),
    ]);
  } catch (error) {
    console.error("Error fetching levels/courses:", error);
  }

  const transformedCourses = courses.map((course: CourseWithLevel) => ({
    id: course.id,
    title: course.title,
    levelId: course.levelCourses[0]?.levelId || null
  }));

  const canCreatePosts = user.role === "ADMIN" || user.role === "TEACHER";

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
              Foro
            </h2>
            <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
              Comparte tus dudas y conocimientos con la comunidad
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
            levels={levels}
            courses={transformedCourses}
            canCreatePosts={canCreatePosts}
          />
        </div>
      </div>
    </div>
  );
}
