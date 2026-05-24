import { getLevels } from "@/actions/level";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LevelsDataTable } from "./_components/levels-table";
import { prisma } from "@/lib/db";
import { Header } from "./_components/header";
import { TeachersDataTable } from "./_components/teachers-table";
import { Card } from "@/components/ui/card";
import { GraduationCapIcon, UsersIcon } from "lucide-react";
import { StudentManagement } from "./_components/students-management";
import { TeachersList } from "./_components/teacher-list";
import { Users } from "lucide-react";

async function getUnassignedUsers() {
  const unassignedStudents = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      levelId: null,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const unassignedTeachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      teacherLevels: {
        none: {},
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return {
    students: unassignedStudents,
    teachers: unassignedTeachers,
  };
}

async function getTeachers() {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      isDeleted: false,
    },
    include: {
      teacherLevels: {
        include: {
          level: true,
        },
      },
    },
  });

  return teachers;
}

async function getAllStudents() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      studentLevel: {
        select: {
          name: true,
        },
      },
      assignmentScores: {
        select: {
          score: true,
          submittedAt: true,
        },
      },
      payments: {
        select: {
          status: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  });

  return students;
}

export default async function StudentsAndProfessors() {
  const levels = await getLevels();
  const unassignedUsers = await getUnassignedUsers();
  const teachers = await getTeachers();
  const students = await getAllStudents();
  const totalStudents = levels.reduce(
    (acc, level) => acc + level.students.length,
    0
  );
  const unassignedStudents = unassignedUsers.students.length;

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
            >
              <Users className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-white/90" />
            </div>
            <div>
              <h2
                className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                text-primary dark:text-white/80 font-['Open_Sans']"
              >
                Estudiantes y Docentes
              </h2>
              <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
                Gestiona los usuarios y sus asignaciones a niveles
              </p>
            </div>
          </div>
          <Header />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-tertiary/10 rounded-full">
                <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-tertiary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Sin Asignar
                </p>
                <p className="text-xl sm:text-2xl font-bold">{unassignedStudents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary/10 rounded-full">
                <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Estudiantes
                </p>
                <p className="text-xl sm:text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <GraduationCapIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Maestros
                </p>
                <p className="text-xl sm:text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <GraduationCapIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Grados
                </p>
                <p className="text-xl sm:text-2xl font-bold">{levels.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="rounded-lg bg-card overflow-hidden">
          <Tabs defaultValue="students" className="w-full">
            <div className="border-b bg-muted w-full">
              <TabsList className="w-full justify-start m-2">
                <TabsTrigger
                  value="students"
                  className="group data-[state=active]:bg-primary/10 rounded-md transition-all duration-200 ease-in-out"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    Estudiantes
                    <span className="rounded bg-transparent px-2 py-0.5 text-xs font-black text-primary group-data-[state=active]:text-secondary group-data-[state=active]:bg-card transition-all duration-200 ease-in-out">
                      {totalStudents}
                    </span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="teachers"
                  className="group data-[state=active]:bg-primary/10 rounded-md transition-all duration-200 ease-in-out"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    Maestros
                    <span className="rounded bg-transparent px-2 py-0.5 text-xs font-black text-primary group-data-[state=active]:text-secondary group-data-[state=active]:bg-card transition-all duration-200 ease-in-out">
                      {teachers.length}
                    </span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              <TabsContent value="students" className="mt-0">
                <StudentManagement
                  unassignedUsers={unassignedUsers}
                  data={levels}
                  students={students}
                />
              </TabsContent>

              <TabsContent value="teachers" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Gestión de Maestros</h2>
                </div>
                <TeachersDataTable teachers={teachers} levels={levels} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ScrollArea>
  );
}

export const revalidate = 0;
