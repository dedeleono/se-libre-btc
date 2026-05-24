import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { levelId: string } }
) {
  try {
    const session = await auth();
    const { name } = await req.json();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sourceLevel = await prisma.level.findUnique({
      where: {
        id: params.levelId,
      },
      include: {
        levelCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!sourceLevel) {
      return new NextResponse("Level not found", { status: 404 });
    }

    // Create new level
    const newLevel = await prisma.level.create({
      data: {
        name,
        position: sourceLevel.position + 1,
      },
    });

    // Duplicate course associations
    const levelCoursesData = sourceLevel.levelCourses.map((lc) => ({
      levelId: newLevel.id,
      courseId: lc.courseId,
    }));

    if (levelCoursesData.length > 0) {
      await prisma.levelCourse.createMany({
        data: levelCoursesData,
      });
    }

    return NextResponse.json(newLevel);
  } catch (error) {
    console.error("[LEVEL_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 