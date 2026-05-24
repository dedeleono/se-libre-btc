import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { CreateAcademicYearButton } from "./_components/create-academic-year-button";
import { RolloverYearButton } from "./_components/rollover-year-button";

const AcademicYearsPage = async () => {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  // Fetch all academic years
  const academicYears = await prisma.academicYear.findMany({
    orderBy: {
      startDate: "desc",
    },
    include: {
      studentAcademicYears: true,
    },
  });

  // Get the active academic year
  const activeYear = academicYears.find((year) => year.isActive);

  // Calculate enrollment summary for each year
  const yearSummaries = await Promise.all(
    academicYears.map(async (year) => {
      const enrollments = await prisma.studentAcademicYear.findMany({
        where: { academicYearId: year.id },
        include: {
          student: true,
          level: true,
        },
      });

      const totalStudents = enrollments.length;
      const paidStudents = enrollments.filter((e) => e.isPaid).length;
      const completedStudents = enrollments.filter(
        (e) => e.status === "COMPLETED"
      ).length;
      const failedStudents = enrollments.filter(
        (e) => e.status === "FAILED"
      ).length;
      const activeStudents = enrollments.filter(
        (e) => e.status === "ACTIVE"
      ).length;

      const levelDistribution = enrollments.reduce((acc, enrollment) => {
        const levelName = enrollment.level.name;
        acc[levelName] = (acc[levelName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        year,
        totalStudents,
        paidStudents,
        completedStudents,
        failedStudents,
        activeStudents,
        levelDistribution,
      };
    })
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Años Académicos</h1>
          <p className="text-muted-foreground">
            Gestiona los años académicos y avance de estudiantes
          </p>
        </div>
        <div className="flex space-x-2">
          <CreateAcademicYearButton />
          {activeYear && (
            <RolloverYearButton 
              currentYearId={activeYear.id} 
              nextYear={academicYears.find(
                (y) => 
                  new Date(y.startDate) > new Date(activeYear.endDate) && 
                  !y.isActive
              )} 
            />
          )}
        </div>
      </div>

      {/* Academic Years Summary */}
      <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
        {yearSummaries.slice(0, 3).map(({ year, totalStudents, paidStudents, activeStudents, completedStudents, failedStudents }) => (
          <Card key={year.id} className={year.isActive ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">{year.name}</CardTitle>
                <CardDescription>
                  1 ene - 31 dic
                </CardDescription>
              </div>
              {year.isActive && (
                <Badge className="bg-primary text-primary-foreground">
                  Activo
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                  <p className="font-medium">{totalStudents}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pagados</p>
                  <p className="font-medium">{paidStudents} ({Math.round((paidStudents / (totalStudents || 1)) * 100)}%)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="font-medium">{activeStudents}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="font-medium">{completedStudents}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/admin/academic-years/${year.id}`} className="w-full">
                <Button variant="outline" className="w-full" size="sm">
                  Ver Detalle
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Academic Years Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Todos los Años Académicos</CardTitle>
          <CardDescription>
            Historial completo de años académicos y su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={yearSummaries} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicYearsPage; 