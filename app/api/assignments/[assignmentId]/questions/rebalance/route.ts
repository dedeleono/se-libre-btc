import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateAndAdjustQuestionPoints, normalizeScore } from "@/actions/score-calcs";

export async function POST(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      include: { questions: true }
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    // First normalize questions to sum to 100
    const adjustedQuestions = validateAndAdjustQuestionPoints(assignment.questions);

    // Then scale each question's points to the assignment's maxPoints
    const scaledQuestions = adjustedQuestions.map(question => ({
      ...question,
      points: normalizeScore(question.points, 100, assignment.maxPoints || 0)
    }));

    // Update all questions with the scaled points
    await Promise.all(
      scaledQuestions.map(question =>
        prisma.question.update({
          where: { id: question.id },
          data: { points: question.points },
        })
      )
    );

    return NextResponse.json(scaledQuestions);
  } catch (error) {
    console.error("[QUESTIONS_REBALANCE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 