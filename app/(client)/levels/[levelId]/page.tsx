import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LevelHeader } from "./_components/level-header";
import { LevelContent } from "./_components/level-content";

interface LevelPageProps {
  params: {
    levelId: string;
  };
}

const LevelPage = async ({ params }: LevelPageProps) => {
  const session = await auth();

  const level = await prisma.level.findUnique({
    where: {
      id: params.levelId,
    },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      teacherLevels: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      levelCourses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              modules: {
                select: {
                  id: true,
                  title: true,
                },
              },
              teacher: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!level) {
    return redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 
      dark:from-black/40 dark:to-black/20 dark:backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <LevelHeader level={level} />
        <LevelContent
          level={level}
          isStudent={session?.user?.role === "STUDENT"}
        />
      </div>
    </div>
  );
};

export default LevelPage;
