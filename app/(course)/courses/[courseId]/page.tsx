import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

// Fallback entry: dashboard / course cards now link directly to the first
// chapter, so this route is only hit on direct /courses/[id] navigation. Keep
// the query minimal — just the chapter ids needed to compute the redirect.
const CoursePage = async ({ params }: { params: { courseId: string } }) => {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: {
      id: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  // First published chapter in (module.position, chapter.position) order.
  const firstChapterId = course.modules.flatMap((module) => module.chapters)[0]?.id;

  if (!firstChapterId) {
    return redirect("/student/browse");
  }

  return redirect(`/courses/${course.id}/chapters/${firstChapterId}`);
};

export default CoursePage;
