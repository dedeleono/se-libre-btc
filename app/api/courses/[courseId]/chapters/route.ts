import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return new NextResponse("Module ID is required", { status: 400 });
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        moduleId,
        isPublished: true,
      },
      include: {
        studentProgress: {
          where: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("[CHAPTERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 