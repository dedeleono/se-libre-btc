import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Award, BadgeCheck, BadgeX, CreditCard } from "lucide-react";

interface YearSummaryProps {
  totalStudents: number;
  paidStudents: number;
  activeStudents: number;
  completedStudents: number;
  failedStudents: number;
  averageGrade: number;
}

export const YearSummary = ({
  totalStudents,
  paidStudents,
  activeStudents,
  completedStudents,
  failedStudents,
  averageGrade,
}: YearSummaryProps) => {
  const paymentPercentage = totalStudents > 0 
    ? Math.round((paidStudents / totalStudents) * 100) 
    : 0;
  
  const completionRate = totalStudents > 0
    ? Math.round(((completedStudents + failedStudents) / totalStudents) * 100)
    : 0;
  
  const passRate = (completedStudents + failedStudents) > 0
    ? Math.round((completedStudents / (completedStudents + failedStudents)) * 100)
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeStudents} activos · {completedStudents} aprobados · {failedStudents} reprobados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Estado de Pagos</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentPercentage}%</div>
          <div className="mt-2">
            <Progress value={paymentPercentage} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paidStudents} de {totalStudents} estudiantes han pagado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
          <BadgeCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{passRate}%</div>
          <div className="mt-2">
            <Progress value={passRate} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedStudents} aprobados de {completedStudents + failedStudents} evaluados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageGrade ? averageGrade.toFixed(1) : "N/A"}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </div>
          {averageGrade ? (
            <div className="mt-2">
              <Progress value={averageGrade} className="h-2" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              No hay calificaciones registradas
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}; 