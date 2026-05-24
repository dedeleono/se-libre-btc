import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
        chapter: {
          include: {
            module: {
              include: {
                chapters: {
                  include: {
                    assignments: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    const courseModule = assignment.chapter.module;
    const assignments = courseModule.chapters
      .filter(chapter => chapter.type === "ASSIGNMENT")
      .map(chapter => chapter.assignments[0]);

    const quiz = courseModule.chapters
      .find(chapter => chapter.type === "QUIZ")
      ?.assignments[0];

    // Calculate weights based on maxPoints
    const totalPoints = assignments.reduce((sum, a) => sum + (a.maxPoints || 0), 0) + (quiz?.maxPoints || 0);
    const assignmentsWeight = totalPoints > 0 ? Math.round((assignments.reduce((sum, a) => sum + (a.maxPoints || 0), 0) / totalPoints) * 100) : 70;
    const quizWeight = totalPoints > 0 ? Math.round(((quiz?.maxPoints || 0) / totalPoints) * 100) : 30;

    return NextResponse.json({
      quizWeight,
      assignmentsWeight
    });
  } catch (error) {
    console.error("[MODULE_SCORING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 