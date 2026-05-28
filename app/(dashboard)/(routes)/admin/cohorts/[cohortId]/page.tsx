import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

import { CohortForm } from "../_components/cohort-form";

const dateValue = (date?: Date | null) => date?.toISOString().slice(0, 10) || "";
const dateTimeValue = (date?: Date | null) => date?.toISOString().slice(0, 16) || "";

export default async function CohortDetailPage({
  params,
}: {
  params: { cohortId: string };
}) {
  const [cohort, courses, learningPaths] = await Promise.all([
    prisma.cohort.findUnique({
      where: { id: params.cohortId },
      include: {
        liveSessions: { orderBy: { startsAt: "asc" } },
        enrollments: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.learningPath.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  if (!cohort) {
    return redirect("/admin/cohorts");
  }

  return (
    <CohortForm
      courses={courses}
      learningPaths={learningPaths}
      initialData={{
        id: cohort.id,
        title: cohort.title,
        slug: cohort.slug,
        description: cohort.description || "",
        status: cohort.status,
        capacity: cohort.capacity?.toString() || "",
        startDate: dateValue(cohort.startDate),
        endDate: dateValue(cohort.endDate),
        courseId: cohort.courseId || "",
        learningPathId: cohort.learningPathId || "",
        liveSessions: cohort.liveSessions.map((session) => ({
          id: session.id,
          title: session.title,
          description: session.description || "",
          status: session.status,
          startsAt: dateTimeValue(session.startsAt),
          endsAt: dateTimeValue(session.endsAt),
          meetingUrl: session.meetingUrl || "",
          recordingUrl: session.recordingUrl || "",
        })),
        enrollments: cohort.enrollments,
      }}
    />
  );
}
