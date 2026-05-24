import { StudentCourse, Course, User } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CourseCard } from "./course-card";
import { GraduationCap, BookOpen, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCoursesTable } from "./student-courses-table";

interface Level {
  id: string;
  name: string;
  price: number | null;
  inscriptionPrice: number | null;
  inscriptionPaid: boolean;
}

interface StudentCoursesViewProps {
  level: Level | null;
  courses: (StudentCourse & {
    course: Course & {
      teacher: User | null;
      modules: any[];
    };
  })[];
}

export const StudentCoursesView = ({
  level,
  courses,
}: StudentCoursesViewProps) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="grid" className="space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-['Open_Sans'] font-bold">
                    {level ? level.name : "Sin grado asignado"}
                  </CardTitle>
                  <CardDescription className="sm:text-sm text-xs text-primary dark:text-secondary">
                    {level
                      ? `${courses.length} ${
                          courses.length === 1
                            ? "curso asignado"
                            : "cursos asignados"
                        }`
                      : "Contacta a tu profesor para que te asigne un grado"}
                  </CardDescription>
                </div>
              </div>
              <TabsList className="hidden sm:flex dark:bg-success/10 bg-primary/10 p-1 rounded-xl">
                <TabsTrigger
                  value="grid"
                  className="flex items-center gap-2 data-[state=active]:bg-primary/20 
                    data-[state=active]:text-primary dark:data-[state=active]:bg-success/20 dark:data-[state=active]:text-accent/90
                    rounded-lg transition-all duration-200"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Grid</span>
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="flex items-center gap-2 data-[state=active]:bg-primary/20 
                    data-[state=active]:text-primary dark:data-[state=active]:bg-success/20 dark:data-[state=active]:text-accent/90
                    rounded-lg transition-all duration-200"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Lista</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
        </Card>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="p-2 bg-primary/10 rounded-full mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">
              No tienes cursos asignados
            </h3>
            <p className="text-muted-foreground mt-2">
              Los cursos aparecerán aquí una vez que sean asignados a tu grado
            </p>
          </div>
        ) : (
          <>
            <TabsList className="sm:hidden bg-primary/10 p-1 rounded-xl">
              <TabsTrigger
                value="grid"
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 
                  data-[state=active]:text-primary dark:data-[state=active]:text-primary/90
                  rounded-lg transition-all duration-200"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Grid</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 
                  data-[state=active]:text-primary dark:data-[state=active]:text-primary/90
                  rounded-lg transition-all duration-200"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Lista</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {courses.map((studentCourse) => (
                  <CourseCard
                    key={studentCourse.courseId}
                    course={studentCourse.course}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <div
                className="bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
                dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
                dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              >
                <StudentCoursesTable courses={courses} />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};
