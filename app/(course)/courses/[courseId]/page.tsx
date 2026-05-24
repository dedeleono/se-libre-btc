import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

const CoursePage = async ({ params }: { params: { courseId: string } }) => {
  // First, get the course with all modules (without chapters)
  // const course = await prisma.course.findUnique({
  //   where: {
  //     id: params.courseId,
  //   },
  //   include: {
  //     modules: {
  //       orderBy: {
  //         position: "asc",
  //       },
  //     },
  //   },
  // });

  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      modules: {
        orderBy: {
          position: "asc",
        },
        include: {
          chapters: {
            where: {
              isPublished: true,
            },
            orderBy: {
              position: "asc",
            },
            take: 1, // Only need the first chapter from each module
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  if (!course.modules.length) {
    return redirect("/student/browse");
  }

  // Then, get the first module's chapters
  // const firstModule = await prisma.courseModule.findUnique({
  //   where: {
  //     id: course.modules[0].id,
  //   },
  //   include: {
  //     chapters: {
  //       where: {
  //         isPublished: true,
  //       },
  //       orderBy: {
  //         position: "asc",
  //       },
  //     },
  //   },
  // });

  const firstModule = course.modules[0];

  if (!firstModule?.chapters.length) {
    return redirect("/student/browse");
  }

  return redirect(
    `/courses/${course.id}/chapters/${firstModule.chapters[0].id}`
  );
};

export default CoursePage;
