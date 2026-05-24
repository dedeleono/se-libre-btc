import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { AssignmentWithRelations } from "@/types/assignments";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionManager } from "@/lib/db/transaction-manager";
import { Prisma } from "@prisma/client";

type PageProps = {
  searchParams: { page?: string; limit?: string }
}

// Add this type to handle the raw query result
type RawAssignment = {
  id: string;
  title: string;
  description: string | null;
  isQuiz: boolean;
  isOnline: boolean;
  maxPoints: number | null;
  timer: number | null;
  deadline: Date | null;
  chapterId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  chapter: {
    id: string;
    module: {
      id: string;
      course: {
        id: string;
        title: string;
        levelCourses: {
          level: {
            id: string;
            name: string;
            position: number;
          };
        }[];
      };
    };
  };
  submissions: {
    id: string;
    status: "PENDING" | "SUBMITTED" | "GRADED";
  }[] | null;
};

const getAssignments = async ({ page = "1", limit = "50" }: { page?: string; limit?: string }) => {
  try {
    const session = await auth();
    if (!session?.user) return redirect("/");
    
    const isAdmin = session.user.role === "ADMIN";
    const pageNumber = parseInt(page, 10);
    const levelsPerPage = 3; // Number of levels to fetch per page
    
    // Create a transaction manager instance
    const transactionManager = TransactionManager.getInstance();
    
    return await transactionManager.executeQuery(async () => {
      // First, get the levels based on role, ordered by position
      const levelsQuery = isAdmin
        ? prisma.level.findMany({
            orderBy: [
              { position: "asc" },
              { id: "asc" }
            ],
            take: levelsPerPage,
            skip: (pageNumber - 1) * levelsPerPage,
            where: {
              levelCourses: {
                some: {
                  course: {
                    modules: {
                      some: {
                        chapters: {
                          some: {
                            assignments: { some: {} },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : prisma.level.findMany({
            orderBy: [
              { position: "asc" },
              { id: "asc" }
            ],
            take: levelsPerPage,
            skip: (pageNumber - 1) * levelsPerPage,
            where: {
              OR: [
                {
                  teacherLevels: {
                    some: { teacherId: session?.user?.id },
                  },
                },
                {
                  levelCourses: {
                    some: {
                      course: { teacherId: session?.user?.id },
                    },
                  },
                },
              ],
              levelCourses: {
                some: {
                  course: {
                    modules: {
                      some: {
                        chapters: {
                          some: {
                            assignments: { some: {} },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          });

      // Count total levels based on role
      const totalLevelsQuery = isAdmin
        ? prisma.level.count({
            where: {
              levelCourses: {
                some: {
                  course: {
                    modules: {
                      some: {
                        chapters: {
                          some: {
                            assignments: { some: {} },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : prisma.level.count({
            where: {
              OR: [
                {
                  teacherLevels: {
                    some: { teacherId: session?.user?.id },
                  },
                },
                {
                  levelCourses: {
                    some: {
                      course: { teacherId: session?.user?.id },
                    },
                  },
                },
              ],
              levelCourses: {
                some: {
                  course: {
                    modules: {
                      some: {
                        chapters: {
                          some: {
                            assignments: { some: {} },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          });

      // Execute both queries concurrently for efficiency
      const [levels, totalLevels] = await Promise.all([levelsQuery, totalLevelsQuery]);
      
      if (levels.length === 0) {
        return [0, [], isAdmin, totalLevels, levelsPerPage] as const;
      }

      // Get level IDs for fetching assignments
      const levelIds = levels.map(level => level.id);

      // Fetch all assignments for these specific levels
      const assignmentsQuery = isAdmin
        ? prisma.assignment.findMany({
            where: {
              chapter: {
                module: {
                  course: {
                    levelCourses: {
                      some: {
                        levelId: { in: levelIds },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            include: {
              chapter: {
                include: {
                  module: {
                    include: {
                      course: {
                        include: {
                          levelCourses: {
                            include: {
                              level: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              submissions: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          })
        : prisma.assignment.findMany({
            where: {
              chapter: {
                module: {
                  course: {
                    OR: [
                      { teacherId: session?.user?.id },
                      {
                        levelCourses: {
                          some: {
                            level: {
                              teacherLevels: {
                                some: {
                                  teacherId: session?.user?.id,
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                    levelCourses: {
                      some: {
                        levelId: { in: levelIds },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            include: {
              chapter: {
                include: {
                  module: {
                    include: {
                      course: {
                        include: {
                          levelCourses: {
                            include: {
                              level: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              submissions: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          });

      // Count total assignments based on role
      const totalAssignmentsQuery = isAdmin
        ? prisma.assignment.count()
        : prisma.assignment.count({
            where: {
              chapter: {
                module: {
                  course: {
                    OR: [
                      { teacherId: session?.user?.id },
                      {
                        levelCourses: {
                          some: {
                            level: {
                              teacherLevels: {
                                some: {
                                  teacherId: session?.user?.id,
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          });

      // Execute assignment queries concurrently
      const [assignments, totalAssignments] = await Promise.all([
        assignmentsQuery, 
        totalAssignmentsQuery
      ]);
      
      return [totalAssignments, assignments, isAdmin, totalLevels, levelsPerPage] as const;
    });
  } catch (error) {
    console.error("[GET_ASSIGNMENTS]", error);
    return [0, [], false, 0, 5] as const;
  }
};

const AssignmentsPage = async ({ searchParams }: PageProps) => {
  const [totalAssignments, assignments, isAdmin, totalLevels, levelsPerPage] = 
    await getAssignments({ 
      page: searchParams.page,
      limit: searchParams.limit
    }) as [number, AssignmentWithRelations[], boolean, number, number];

  // Calculate these values for use in the links:
  const currentPage = parseInt(searchParams.page || "1");
  const prevPage = currentPage > 1 ? currentPage - 1 : 1;
  const nextPage = currentPage < Math.ceil(totalLevels / levelsPerPage) 
    ? currentPage + 1 
    : currentPage;
  const totalPages = Math.ceil(totalLevels / levelsPerPage);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-blue-600/5 
              dark:from-blue-600/30 dark:via-blue-600/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <ScrollText className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                text-blue-600 dark:text-accent-foreground font-['Open_Sans']">
                Gestión de Tareas
              </h2>
              <p className="text-xs dark:text-white/50 font-['Open_Sans']">
                {isAdmin 
                 ? "Como administrador, tienes acceso a todas las tareas del sistema"
                 : "Revisa y administra las tareas de los estudiantes en todos tus cursos"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
          dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
          dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="p-4 sm:p-6 bg-card rounded-xl">
            {assignments.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <ScrollText className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="mt-6 text-xl font-semibold">
                    No se han agregado tareas todavía
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Crea tareas en tus cursos para comenzar a rastrear el progreso de
                    los estudiantes
                  </p>
                </div>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={assignments} 
                totalItems={totalAssignments}
                pageSize={parseInt(searchParams.limit || "50")}
                currentPage={parseInt(searchParams.page || "1")}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{Math.min(levelsPerPage, totalLevels)} de {totalLevels}</span> niveles
            <span className="ml-2">({totalAssignments} tareas en total)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href={`?page=${parseInt(searchParams.page || "1") > 1 ? parseInt(searchParams.page || "1") - 1 : 1}`}
              prefetch={false}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={parseInt(searchParams.page || "1") <= 1}
                className="text-xs sm:text-sm hover:bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="text-sm">
              Página {parseInt(searchParams.page || "1")} de {Math.ceil(totalLevels / levelsPerPage)}
            </div>
            <Link 
              href={`?page=${parseInt(searchParams.page || "1") < Math.ceil(totalLevels / levelsPerPage) ? parseInt(searchParams.page || "1") + 1 : parseInt(searchParams.page || "1")}`}
              prefetch={false}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={parseInt(searchParams.page || "1") >= Math.ceil(totalLevels / levelsPerPage)}
                className="text-xs sm:text-sm hover:bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default AssignmentsPage;

export const fetchCache = 'force-no-store'; // Ensures fresh data on each request
export const revalidate = 0;