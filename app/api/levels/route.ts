import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createCachedFunction } from "@/lib/cache";

const getLevels = createCachedFunction(async () => {
  return await prisma.level.findMany({
    orderBy: {
      position: 'asc',
    },
    include: {
      students: {
        select: {
          id: true,
          name: true,
        },
      },
      levelCourses: {
        select: {
          course: {
            select: {
              title: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
}, { revalidate: 600 }); // Cache for 10 minutes

export async function GET() {
    try {
        const levels = await getLevels();
        return NextResponse.json(levels);
    } catch (error) {
        console.error("[LEVELS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}