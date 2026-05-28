import { prisma } from "@/lib/db";

import { LearningPathForm } from "../_components/learning-path-form";

export default async function NewLearningPathPage() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return <LearningPathForm courses={courses} />;
}
