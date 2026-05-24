import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { addDays, addWeeks, startOfWeek, isSaturday, isSunday, nextMonday, setDay } from "date-fns";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    const values = await req.json();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First verify the course exists and user has access
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
      },
      include: {
        modules: {
          include: {
            chapters: {
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Only allow teachers and admins to update the course
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // If user is a teacher, verify they own the course
    if (session.user.role === "TEACHER" && course.teacherId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update course time frame
    const updatedCourse = await prisma.course.update({
      where: {
        id: params.courseId,
      },
      data: {
        courseStartDate: values.courseStartDate ? new Date(values.courseStartDate) : null,
        courseEndDate: values.courseEndDate ? new Date(values.courseEndDate) : null,
        lessonDuration: values.lessonDuration,
      },
    });

    // If time frame is set, update all chapters
    if (values.courseStartDate && values.lessonDuration) {
      const startDate = new Date(values.courseStartDate);
      // Instead of moving to start of week, ensure we're on a Monday
      let currentDate = isSaturday(startDate) || isSunday(startDate) 
        ? nextMonday(startDate) 
        : startDate;
      
      // Calculate time slots for each chapter
      for (const courseModule of course.modules) {
        for (const chapter of courseModule.chapters) {
          const chapterStartDate = currentDate;
          let chapterEndDate;

          // Calculate end date based on lesson duration
          switch (values.lessonDuration) {
            case "daily":
              chapterEndDate = setDay(chapterStartDate, 5); // End on Friday
              currentDate = addDays(chapterStartDate, 1); // Next day
              break;
            case "weekly":
              chapterEndDate = setDay(chapterStartDate, 5); // End on Friday
              currentDate = addWeeks(chapterStartDate, 1); // Next week, same day
              break;
            case "biweekly":
              chapterEndDate = setDay(addWeeks(chapterStartDate, 1), 5);
              currentDate = addWeeks(chapterStartDate, 2); // Two weeks later
              break;
            case "monthly":
              chapterEndDate = setDay(addWeeks(chapterStartDate, 3), 5);
              currentDate = addWeeks(chapterStartDate, 4); // Four weeks later
              break;
          }

          // Update chapter time frame
          await prisma.chapter.update({
            where: {
              id: chapter.id,
            },
            data: {
              startTime: chapterStartDate,
              endTime: chapterEndDate,
            },
          });
        }
      }
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.log("[COURSE_TIME_FRAME]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 