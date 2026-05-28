import { prisma } from "@/lib/db";

import { CohortForm } from "../_components/cohort-form";

export default async function NewCohortPage() {
  const [courses, learningPaths] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.learningPath.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return <CohortForm courses={courses} learningPaths={learningPaths} />;
}
