import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User2, CreditCard, ArrowLeft, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyEmail } from "./_components/copy-email";
import Link from "next/link";
import EditableMineducId from "./_components/mineducId";

interface StudentPageProps {
  params: {
    studentId: string;
  };
}

const getStudentData = async (studentId: string) => {
  try {
    return await prisma.user.findUnique({
      where: {
        id: studentId,
        role: "STUDENT",
      },
      include: {
        studentLevel: true,
        studentCourses: {
          include: {
            course: true,
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
                        course: true,
                      },
                    },
                  },
                },
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
            answers: {
              include: {
                question: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        assignmentScores: true,
        payments: true,
      },
    });
  } catch (error) {
    console.error("[GET_STUDENT_DATA]", error);
    return null;
  }
};

export default async function StudentPage({ params }: StudentPageProps) {

  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return redirect("/");
  }

  const studentData = await getStudentData(params.studentId);

  if (!studentData) {
    return redirect("/teacher/students");
  }

  const formattedCourses = studentData.studentCourses.map((sc: any) => ({
    id: sc.course.id,
    title: sc.course.title,
    submissions: studentData.submissions.filter(
      (s: any) => s.assignment.chapter.module.course.id === sc.course.id
    ),
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-8">
        {session.user.role === "ADMIN" && (
          <div className="flex items-center gap-x-2 mb-6 w-full justify-between">
            <Link
              href="/admin/sp"
              className="flex items-center text-sm dark:text-white/70 hover:dark:text-white/90 
                transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
              Volver a Estudiantes
            </Link>
            <Link
              key={`${params.studentId}`}
              href={`/student/${params.studentId}/history`}
              className={cn(
                "py-2 px-4 rounded-md flex items-center gap-x-2 text-sm font-medium transition-all"
              )}
            >
              <History className="h-4 w-4" />
              Ver Historial Académico
            </Link>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 max-h-[calc(350px)]">
            <CardHeader className="flex flex-row items-center gap-x-3 space-y-0">
              <div className="p-2 bg-primary/10 rounded-full">
                <User2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {studentData.firstName || studentData.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    {studentData.studentLevel?.name || "Sin nivel asignado"}
                  </Badge>
                  <Badge
                    variant={studentData.isDeleted ? "destructive" : "default"}
                    className={cn(
                      studentData.isDeleted
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    )}
                  >
                    {studentData.isDeleted ? "Inactivo" : "Activo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-4 mt-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Carné
                </div>
                <CopyEmail email={studentData.carnet?.slice(0, 8) || ""} type="carnet" />
              </div>
              <div className="space-y-2 col-span-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Email
                </div>
                <CopyEmail email={studentData.email} type="email" />
              </div>

              <div className="col-span-3">
                <EditableMineducId
                  studentId={studentData.id}
                  initialValue={studentData.mineducId || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col max-h-[calc(350px)]">
            <CardHeader>
              <CardTitle>Estado de Pagos</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[calc(100%-5rem)]">
              <div className="space-y-2">
                {studentData.payments?.length ? (
                  studentData.payments.map((payment: any) => {
                    const statusConfig = {
                      COMPLETED: {
                        variant: "default" as const,
                        bgColor: "bg-green-50",
                        textColor: "text-green-700",
                        label: "Completado",
                      },
                      PENDING: {
                        variant: "secondary" as const,
                        bgColor: "bg-yellow-50",
                        textColor: "text-yellow-700",
                        label: "Pendiente",
                      },
                      FAILED: {
                        variant: "destructive" as const,
                        bgColor: "bg-red-50",
                        textColor: "text-red-700",
                        label: "Fallido",
                      },
                      REFUNDED: {
                        variant: "secondary" as const,
                        bgColor: "bg-blue-50",
                        textColor: "text-blue-700",
                        label: "Reembolsado",
                      },
                    } as const;

                    // Add type safety
                    type PaymentStatusConfig = typeof statusConfig;
                    const config =
                      statusConfig[
                        payment.status as keyof PaymentStatusConfig
                      ] || statusConfig.FAILED;

                    return (
                      <div
                        key={payment.id}
                        className={`p-3 rounded-lg ${config.bgColor} border flex items-center justify-between`}
                      >
                        <div className="space-y-1">
                          <p className={`font-medium ${config.textColor}`}>
                            Q.{payment.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-100/80 rounded-full">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-gray-600 text-xs">
                        Sin pagos registrados
                      </h3>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Information Section */}
        <div className="rounded-xl border bg-card">
          {/* <div className="flex items-center justify-between p-6 border-b">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Historial Académico
              </h2>
              <p className="text-sm text-muted-foreground">
                Registro de tareas y evaluaciones
              </p>
            </div>
          </div> */}
          <div className="p-6">
            <DataTable
              columns={columns}
              data={studentData.submissions}
              studentCourses={formattedCourses}
              studentId={params.studentId}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
