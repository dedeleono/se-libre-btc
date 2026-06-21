import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

import { LearningPathForm } from "../_components/learning-path-form";

export default async function LearningPathDetailPage(
  props: {
    params: Promise<{ learningPathId: string }>;
  }
) {
  const params = await props.params;
  const [learningPath, courses] = await Promise.all([
    prisma.learningPath.findUnique({
      where: { id: params.learningPathId },
      include: {
        courses: {
          include: { course: { select: { id: true, title: true } } },
          orderBy: { position: "asc" },
        },
      },
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!learningPath) {
    return redirect("/admin/learning-paths");
  }

  return (
    <LearningPathForm
      courses={courses}
      initialData={{
        id: learningPath.id,
        title: learningPath.title,
        slug: learningPath.slug,
        description: learningPath.description || "",
        imageUrl: learningPath.imageUrl || "",
        isFree: learningPath.isFree,
        price: learningPath.price?.toString() || "",
        isPublished: learningPath.isPublished,
        courses: learningPath.courses,
      }}
    />
  );
}
