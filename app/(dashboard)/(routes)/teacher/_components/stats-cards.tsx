import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ScrollText, GraduationCap, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCachedDashboardData } from "@/lib/actions";
import { StatsCardsSkeleton } from "./stats-cards-skeleton";

export async function StatsCards({ userId }: { userId: string }) {
  try {
    const dashboardData = await getCachedDashboardData(userId);
    
    if (!dashboardData) {
      console.log("No dashboard data returned");
      return <StatsCardsSkeleton />;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.activeCourses}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de cursos enseñados
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revisiones Pendientes
            </CardTitle>
            <div className="p-2 bg-yellow-100 rounded-full">
              <ScrollText className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.pendingReviews}
            </div>
            <p className="text-xs text-muted-foreground">
              Tareas pendientes para revisar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Estudiantes
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">Estudiantes inscritos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/teacher/create" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Acciones Rápidas
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <PlusCircle className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                variant="default"
                className="w-full mt-2 font-semibold"
              >
                Crear Nuevo Curso
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in StatsCards component:", error);
    return <StatsCardsSkeleton />;
  }
} 