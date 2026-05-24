import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface ReorderRequest {
  list: {
    id: string;
    position: number;
  }[];
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { list } = await req.json() as ReorderRequest;

    // Update all positions in a transaction
    await prisma.$transaction(
      list.map(({ id, position }) =>
        prisma.level.update({
          where: { id },
          data: { position },
        })
      )
    );

    // Fetch updated levels with complete data
    const updatedLevels = await prisma.level.findMany({
      orderBy: {
        position: 'asc',
      },
      include: {
        levelCourses: {
          include: {
            course: {
              include: {
                teacher: true,
                studentCourses: true,
                levelCourses: {
                  include: {
                    level: {
                      include: {
                        students: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      levels: updatedLevels
    });
  } catch (error) {
    console.error("[LEVELS_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 