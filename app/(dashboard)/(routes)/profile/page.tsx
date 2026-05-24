import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserCircle, Mail, GraduationCap, School, User } from "lucide-react";

import ProfileForm from "./_components/profile-form";
import AnimatedSection from "./_components/animated-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@prisma/client";

async function getProfileData(userId: string) {
  const profileData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentLevel: {
        select: {
          id: true,
          name: true,
          position: true,
          price: true,
          inscriptionPrice: true,
          inscriptionPaid: true,
        }
      },
      teacherLevels: {
        include: {
          level: {
            select: {
              id: true,
              name: true,
              position: true,
            }
          },
        },
      },
      studentCourses: {
        include: {
          course: {
            include: {
              teacher: true,
              modules: {
                include: {
                  chapters: true,
                },
              },
            },
          },
        },
      },
      assignmentScores: {
        include: {
          assignment: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
        take: 5,
      },
      levelScores: {
        include: {
          level: {
            select: {
              id: true,
              name: true,
              position: true,
            }
          },
        },
      },
    },
  });

  return profileData;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
  });

  if (!dbUser) {
    return redirect("/");
  }

  const profileData = await getProfileData(dbUser.id);

  if (!profileData) {
    return redirect("/");
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <AnimatedSection className="flex flex-col space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
              >
                <User className="h-8 w-8 text-primary dark:text-white/90" />
              </div>
              <div>
                <h2
                  className="text-3xl font-black tracking-tight md:text-4xl 
                bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70 font-['Open_Sans']"
                >
                  Mi Perfil
                </h2>
                <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
                  Tu información personal y preferencias
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <AnimatedSection direction="x" distance={-20} delay={0.1}>
            <Card className="border-2 border-none hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-x-2">
                  <div
                    className={`p-2 rounded-full ${profileData.role === UserRole.TEACHER ? "bg-orange-700/10" : "bg-teal-700/10"}`}
                  >
                    <UserCircle
                      className={`h-5 w-5 ${profileData.role === UserRole.TEACHER ? "text-orange-700" : "text-teal-700"}`}
                    />
                  </div>
                  <div>
                    <CardTitle>Información Personal</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={profileData} />
              </CardContent>
            </Card>
          </AnimatedSection>

          <div className="space-y-6">
            <AnimatedSection direction="x" distance={20} delay={0.2}>
              <Card className="border-2 border-none">
                <CardHeader>
                  <div className="flex items-center gap-x-2">
                    <div className="p-2 bg-sky-700/10 rounded-full">
                      <Mail className="h-5 w-5 text-sky-700" />
                    </div>
                    <CardTitle>Detalles de la Cuenta</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-sky-700/5 hover:bg-sky-700/10 transition-colors">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {profileData.email}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-sky-700/5 hover:bg-sky-700/10 transition-colors">
                    <p className="text-sm font-medium">Rol</p>
                    <p className="text-sm text-muted-foreground">
                      {profileData.role === UserRole.ADMIN && "Administrador"}
                      {profileData.role === UserRole.TEACHER && "Profesor"}
                      {profileData.role === UserRole.STUDENT && "Estudiante"}
                    </p>
                  </div>
                  {profileData.role === UserRole.STUDENT &&
                    profileData.studentLevel && (
                      <div className="p-4 rounded-lg bg-sky-700/5 hover:bg-sky-700/10 transition-colors">
                        <p className="text-sm font-medium">Grado Actual</p>
                        <p className="text-sm text-muted-foreground">
                          {profileData.studentLevel.name}
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </AnimatedSection>

            {profileData.role === UserRole.TEACHER && (
              <AnimatedSection direction="x" distance={20} delay={0.3}>
                <Card className="border-2 border-primary/10 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-x-2">
                      <div className="p-2 bg-teal-700/10 rounded-full">
                        <School className="h-5 w-5 text-teal-700" />
                      </div>
                      <CardTitle>Niveles Asignados</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profileData.teacherLevels.length > 0 ? (
                      <div className="space-y-2">
                        {profileData.teacherLevels.map((teacherLevel) => (
                          <div
                            key={teacherLevel.levelId}
                            className="flex items-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {teacherLevel.level.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay niveles asignados
                      </p>
                    )}
                  </CardContent>
                </Card>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
