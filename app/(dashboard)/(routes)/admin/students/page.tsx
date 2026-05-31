import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function AdminStudentsPage() {
  const t = getServerMessages();
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-primary/10 p-3">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.admin.studentsTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.admin.manageStudents}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.studentsCount(students.length)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email}</p>
                <p className="text-muted-foreground">{student.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{student.isBanned ? t.common.banned : t.common.active}</span>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noStudentsYet}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
