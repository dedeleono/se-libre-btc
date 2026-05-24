import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Course, User, UserRole } from "@prisma/client";

interface AcademicHistoryProps {
  params: {
    studentId: string;
  };
}

const StudentHistoryPage = async ({ params }: AcademicHistoryProps) => {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  const isSameStudent = session.user.id === params.studentId;
  
  if (!isAdmin && !isTeacher && !isSameStudent) {
    return redirect("/");
  }

  const student = await prisma.user.findUnique({
    where: { id: params.studentId },
    include: {
      studentLevel: {
        include: {
          levelCourses: {
            include: {
              course: true
            }
          }
        }
      },
      academicYears: {
        include: {
          academicYear: true,
          level: true,
          payment: true,
        },
        orderBy: {
          academicYear: {
            startDate: "desc",
          },
        },
      },
      courseScores: {
        include: {
          course: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      submissions: {
        include: {
          assignment: {
            include: {
              chapter: {
                include: {
                  module: {
                    include: {
                      course: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: "desc",
        },
        take: 50,
      },
    },
  });

  if (!student) {
    return redirect("/student");
  }

  type AcademicYear = {
    id: string;
    academicYear: { name: string; startDate: Date; endDate: Date };
    level: { name: string };
    status: string;
    finalGrade: number | null;
    isPaid: boolean;
    payment: { paymentDate: Date | null } | null;
  };

  const academicHistory = student.academicYears.map((year: AcademicYear) => ({
    id: year.id,
    academicYear: year.academicYear.name,
    level: year.level.name,
    finalGrade: year.finalGrade || 0,
    status: year.status,
    isPaid: year.isPaid,
    paymentDate: year.payment?.paymentDate || null,
    startDate: year.academicYear.startDate,
    endDate: year.academicYear.endDate,
  }));

  // Get courses from student's current level
  const levelCourses = student.studentLevel?.levelCourses.map((lc: { course: Course }) => lc.course) || [];
  
  // Map course scores for easy lookup
  const courseScoresMap = new Map(
    student.courseScores.map((score: { courseId: string; score: number }) => [score.courseId, score.score])
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 text-slate-800">
          Historial Académico de {student.name}
        </h1>
        <p className="text-gray-500 text-lg">
          Grado actual: <span className="font-medium text-slate-700">{student.studentLevel?.name || "No asignado"}</span>
        </p>
      </div>

      <Tabs defaultValue="years" className="w-full">
        <TabsList className="mb-4 bg-slate-100/80 p-1 rounded-lg">
          <TabsTrigger value="years" className="px-6 py-2 text-sm font-medium">Años Académicos</TabsTrigger>
          <TabsTrigger value="courses" className="px-6 py-2 text-sm font-medium">Cursos</TabsTrigger>
          <TabsTrigger value="submissions" className="px-6 py-2 text-sm font-medium">Entregas Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="space-y-6">
          {academicHistory.length > 0 ? (
            academicHistory.map((year) => (
              <Card key={year.id} className="mb-5 overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-slate-800">{year.academicYear}</CardTitle>
                    <Badge variant={year.status === "COMPLETED" ? "default" : year.status === "ACTIVE" ? "outline" : "destructive"} 
                           className={`font-medium px-3 py-1 ${year.status === "ACTIVE" ? "border-2" : ""}`}>
                      {year.status === "COMPLETED" ? "Aprobado" : year.status === "ACTIVE" ? "En curso" : "Reprobado"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-slate-500 mt-1">
                    {format(new Date(year.startDate), "dd MMMM yyyy", { locale: es })} - {format(new Date(year.endDate), "dd MMMM yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Nivel</p>
                      <p className="font-medium text-slate-800">{year.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Calificación Final</p>
                      <p className="font-medium text-slate-800">{year.finalGrade.toFixed(1)}/100</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Estado de Pago</p>
                      <p className="font-medium text-slate-800">{year.isPaid ? "Pagado" : "Pendiente"}</p>
                    </div>
                    {year.paymentDate && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Fecha de Pago</p>
                        <p className="font-medium text-slate-800">{format(new Date(year.paymentDate), "dd/MM/yyyy")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 py-12 bg-slate-50 rounded-lg">No hay historial académico disponible.</p>
          )}
        </TabsContent>

        <TabsContent value="courses">
          {levelCourses.length > 0 ? (
            <Card className="mb-4 overflow-hidden border border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 pb-4">
                <CardTitle className="text-slate-800">Cursos de {student.studentLevel?.name || "Nivel actual"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {levelCourses.map((course: Course) => {
                    const score = courseScoresMap.get(course.id) || 0;
                    return (
                      <div key={course.id} className="flex justify-between items-center py-3 px-2 border-b border-slate-100 hover:bg-slate-50 transition-colors rounded">
                        <span className="font-medium text-slate-700">{course.title}</span>
                        <div>
                          <span className="text-sm text-slate-500 mr-3">Promedio:</span>
                          <Badge variant="default" className="px-3 py-1 text-sm font-medium">
                            {score.toFixed(1)}/100
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-gray-500 py-12 bg-slate-50 rounded-lg">No hay cursos disponibles para el nivel actual.</p>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 pb-4">
              <CardTitle className="text-slate-800">Entregas Recientes</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">Las 50 entregas más recientes del estudiante</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {student.submissions.length > 0 ? (
                  student.submissions.map((submission: any) => {
                    return (
                      <div key={submission.id} className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 px-2 border-b border-slate-100 hover:bg-slate-50 transition-colors rounded">
                        <div className="mb-2 md:mb-0">
                          <p className="font-medium text-slate-700">{submission.assignment.title}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {submission.assignment.chapter?.module?.course?.title || ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={
                            submission.status === "GRADED" 
                              ? ("default") 
                              : "outline"
                          } className="px-3 py-1 text-sm font-medium">
                            {submission.status === "GRADED" 
                              ? `${(submission.score || 0).toFixed(1)} pts` 
                              : submission.status === "SUBMITTED" 
                                ? "Entregado" 
                                : "Pendiente"}
                          </Badge>
                          <span className="text-xs text-slate-500 mt-2">
                            {submission.submittedAt 
                              ? format(new Date(submission.submittedAt), "dd/MM/yyyy") 
                              : "No entregado"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-8 bg-slate-50 rounded-lg">No hay entregas disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentHistoryPage; 