import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AcademicStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, ArrowLeft, ArrowUpRight, Pencil, Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StudentList } from "./_components/student-list";
import { YearSummary } from "./_components/year-summary";
import { EditYearButton } from "./_components/edit-year-button";

interface PageProps {
  params: {
    yearId: string;
  };
}

const AcademicYearPage = async ({ params }: PageProps) => {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const { yearId } = params;

  // Fetch academic year with enrolled students
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id: yearId,
    },
    include: {
      studentAcademicYears: {
        include: {
          student: true,
          level: true,
          payment: true,
        },
      },
    },
  });

  if (!academicYear) {
    return notFound();
  }

  // Group students by status
  const activeStudents = academicYear.studentAcademicYears.filter(
    (enrollment) => enrollment.status === AcademicStatus.ACTIVE
  );
  
  const completedStudents = academicYear.studentAcademicYears.filter(
    (enrollment) => enrollment.status === AcademicStatus.COMPLETED
  );
  
  const failedStudents = academicYear.studentAcademicYears.filter(
    (enrollment) => enrollment.status === AcademicStatus.FAILED
  );

  // Group students by level
  const studentsByLevel: Record<string, typeof academicYear.studentAcademicYears> = {};
  
  academicYear.studentAcademicYears.forEach((enrollment) => {
    const levelName = enrollment.level.name;
    if (!studentsByLevel[levelName]) {
      studentsByLevel[levelName] = [];
    }
    studentsByLevel[levelName].push(enrollment);
  });

  // Stats
  const totalStudents = academicYear.studentAcademicYears.length;
  const paidStudents = academicYear.studentAcademicYears.filter(e => e.isPaid).length;
  const averageGrade = academicYear.studentAcademicYears
    .filter(e => e.finalGrade !== null)
    .reduce((sum, e) => sum + (e.finalGrade || 0), 0) / 
    academicYear.studentAcademicYears.filter(e => e.finalGrade !== null).length || 0;

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/admin/academic-years">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="ml-2">
            <h1 className="text-2xl font-bold flex items-center">
              Año Académico: {academicYear.name}
              {academicYear.isActive && (
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  Activo
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">1 ene, 2025 - 31 dic, 2025</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <EditYearButton academicYear={academicYear} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Datos
          </Button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-4">
        <YearSummary
          totalStudents={totalStudents}
          paidStudents={paidStudents}
          activeStudents={activeStudents.length}
          completedStudents={completedStudents.length}
          failedStudents={failedStudents.length}
          averageGrade={averageGrade}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">
            Todos los Estudiantes ({totalStudents})
          </TabsTrigger>
          <TabsTrigger value="active">
            Activos ({activeStudents.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Aprobados ({completedStudents.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Reprobados ({failedStudents.length})
          </TabsTrigger>
          <TabsTrigger value="by-level">Por Nivel</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Estudiantes</CardTitle>
              <CardDescription>
                Lista completa de estudiantes inscritos en el año académico{" "}
                {academicYear.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentList students={academicYear.studentAcademicYears} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes Activos</CardTitle>
              <CardDescription>
                Estudiantes que están cursando actualmente este año académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentList students={activeStudents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes Aprobados</CardTitle>
              <CardDescription>
                Estudiantes que han completado y aprobado este año académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentList students={completedStudents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes Reprobados</CardTitle>
              <CardDescription>
                Estudiantes que no han logrado aprobar este año académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentList students={failedStudents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-level">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes por Nivel</CardTitle>
              <CardDescription>
                Distribución de estudiantes por nivel académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(studentsByLevel).map(
                  ([levelName, students]) => (
                    <div key={levelName} className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {levelName} ({students.length})
                      </h3>
                      <StudentList students={students} />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicYearPage; 