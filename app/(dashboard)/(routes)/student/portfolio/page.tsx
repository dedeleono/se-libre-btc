import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { getStudentScoresData } from "@/lib/student-scores";

export default async function StudentPortfolioPage() {
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

  // Use our standardized utility to get all student data and scores
  const studentScores = await getStudentScoresData(dbUser.id);
  if (!studentScores) return redirect("/");
  
  const { submissions, formattedCourses } = studentScores;

  return (
    <div className="flex-1 space-y-4 p-8">
      <DataTable
        columns={columns}
        data={submissions}
        studentCourses={formattedCourses}
      />
    </div>
  );
}

export const revalidate = 0;
