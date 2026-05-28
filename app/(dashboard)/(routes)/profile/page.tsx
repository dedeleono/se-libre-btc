import { redirect } from "next/navigation";
import { Mail, User, UserCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileForm from "./_components/profile-form";
import AnimatedSection from "./_components/animated-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@prisma/client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }

  const profileData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseEnrollments: { include: { course: true } },
      learningPathEnrollments: { include: { learningPath: true } },
    },
  });

  if (!profileData) {
    return redirect("/");
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <AnimatedSection className="flex flex-col space-y-2">
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border bg-primary/10 p-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">Profile</h1>
                <p className="text-sm text-muted-foreground">Your personal account information.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedSection direction="x" distance={-20} delay={0.1}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-x-2">
                  <div className="rounded-full bg-teal-700/10 p-2">
                    <UserCircle className="h-5 w-5 text-teal-700" />
                  </div>
                  <CardTitle>Personal information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={profileData} />
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection direction="x" distance={20} delay={0.2}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-x-2">
                  <div className="rounded-full bg-sky-700/10 p-2">
                    <Mail className="h-5 w-5 text-sky-700" />
                  </div>
                  <CardTitle>Account details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-sky-700/5 p-4">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profileData.email}</p>
                </div>
                <div className="rounded-lg bg-sky-700/5 p-4">
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {profileData.role === UserRole.ADMIN ? "Admin" : "Student"}
                  </p>
                </div>
                <div className="rounded-lg bg-sky-700/5 p-4">
                  <p className="text-sm font-medium">Enrollments</p>
                  <p className="text-sm text-muted-foreground">
                    {profileData.courseEnrollments.length} courses • {profileData.learningPathEnrollments.length} learning paths
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </ScrollArea>
  );
}
