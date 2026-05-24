import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        moduleId: params.moduleId,
      },
      include: {
        assignments: true,
      },
    });

    const assignments = chapters
      .filter((chapter) => chapter.type === "ASSIGNMENT")
      .map((chapter) => chapter.assignments[0]);

    const quiz = chapters
      .find((chapter) => chapter.type === "QUIZ")
      ?.assignments[0];

    // Add validation
    if (assignments.length === 0) {
      return new NextResponse(
        "Se requiere al menos una tarea para configurar la puntuación",
        { status: 400 }
      );
    }

    const { assignmentsWeight, quizWeight } = await req.json();

    // Calculate individual assignment points
    const individualAssignmentPoints = 
      assignments.length > 0 
        ? Math.round((assignmentsWeight / assignments.length) * 10) / 10 
        : 0;

    // Allow quiz to be optional:
    const quizWeightValue = quiz ? quizWeight : 0;

    // Update all assignments and quiz in a transaction
    await prisma.$transaction([
      ...assignments.map((assignment) =>
        prisma.assignment.update({
          where: { id: assignment.id },
          data: { maxPoints: individualAssignmentPoints },
        })
      ),
      ...(quiz
        ? [
            prisma.assignment.update({
              where: { id: quiz.id },
              data: { maxPoints: quizWeightValue },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      assignmentPoints: individualAssignmentPoints,
      quizPoints: quizWeightValue,
    });
  } catch (error) {
    console.error("[MODULE_SCORING]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 