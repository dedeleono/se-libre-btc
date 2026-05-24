import { ScrollArea } from "@/components/ui/scroll-area";
import { Level, User, Course, LevelCourse } from "@prisma/client";
import { BookOpen } from "lucide-react";

import AllCoursesTable from "./_components/all-courses-table";
import { prisma } from "@/lib/db";
import RerouteButton from "./_components/reroute-button";
import { NewLevelDialog } from "./_components/new-level-form";

interface LevelWithRelations extends Level {
  id: string;
  name: string;
  position: number;
  price: number | null;
  inscriptionPrice: number | null;
  inscriptionPaid: boolean;
  students: User[];
  levelCourses: (LevelCourse & {
    course: Course & {
      teacher: User | null;
      studentCourses: any[];
      levelCourses: {
        level: {
          students: User[];
        };
      }[];
    };
  })[];
}

const getAllLevels = async (): Promise<LevelWithRelations[]> => {
  try {
    const levelsWithCourses = await prisma.level.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        price: true,
        inscriptionPrice: true,
        inscriptionPaid: true,
        students: true,
        levelCourses: {
          include: {
            course: {
              include: {
                teacher: true,
                studentCourses: true,
                levelCourses: {
                  include: {
                    level: {
                      include: {
                        students: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
    return levelsWithCourses;
  } catch (error) {
    console.error("Error fetching levels:", error);
    throw error;
  }
};

const getUnassignedCourses = async () => {
  const courses = await prisma.course.findMany({
    where: {
      levelCourses: {
        none: {},
      },
    },
    include: {
      teacher: true,
      studentCourses: true,
      levelCourses: {
        include: {
          level: {
            include: {
              students: true, // Add this
            },
          },
        },
      },
    },
  });
  return courses;
};

export default async function Courses() {
  const levels = await getAllLevels();
  const unassignedCourses = await getUnassignedCourses();

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-600/20 via-emerald-600/10 to-emerald-600/5 
              dark:from-emerald-600/30 dark:via-emerald-600/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-emerald-600 dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                text-success dark:text-accent-foreground font-['Open_Sans']">
                Gestión de Cursos
              </h2>
              <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
                Administra los cursos y sus asignaciones a grados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 mb-6 mt-2">
            <RerouteButton className="bg-secondary/90 text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 dark-glow sm:text-sm text-xs" />
            <NewLevelDialog className="bg-primary/95 text-primary-foreground hover:bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 dark:bg-primary/80 dark:hover:bg-primary/90 dark-glow sm:text-sm text-xs" />
          </div>
        </div>
        
        <AllCoursesTable
          initialData={levels}
          unassignedCourses={unassignedCourses}
        />
        
      </div>
    </ScrollArea>
  );
}

export const revalidate = 0;