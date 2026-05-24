import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { levelId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if level has students
    const level = await prisma.level.findUnique({
      where: {
        id: params.levelId,
      },
      include: {
        students: true,
        levelCourses: true,
      },
    });

    if (!level) {
      return new NextResponse("Level not found", { status: 404 });
    }

    if (level.students.length > 0) {
      return new NextResponse("Cannot delete level with students", { status: 400 });
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete all LevelCourse records
      await tx.levelCourse.deleteMany({
        where: {
          levelId: params.levelId,
        },
      });

      // Then delete the level itself
      await tx.level.delete({
        where: {
          id: params.levelId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LEVEL_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 