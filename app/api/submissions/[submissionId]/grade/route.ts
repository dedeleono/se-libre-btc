import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateModuleAndCourseScores } from "@/actions/grades";
import { calculateTotalPoints, normalizeScore } from "@/actions/score-calcs";

// Input validation schema
const gradeSchema = z.object({
    scores: z.record(z.string(), z.number()),
    totalPoints: z.number(),
    earnedPoints: z.number(),
    percentage: z.number(),
    regradeReason: z.string().optional()
});

export async function PATCH(
    req: Request,
    { params }: { params: { submissionId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const validation = gradeSchema.safeParse(await req.json());
        if (!validation.success) {
            return new NextResponse("Invalid input", { status: 400 });
        }

        const { scores, totalPoints, earnedPoints, percentage, regradeReason } = validation.data;

        const submission = await prisma.submission.findUnique({
            where: { id: params.submissionId },
            include: {
                assignment: {
                    include: {
                        questions: true,
                        chapter: {
                            include: {
                                module: {
                                    include: {
                                        course: true
                                    }
                                }
                            }
                        }
                    }
                },
                answers: true,
                student: true,
            },
        });

        if (!submission) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (!submission?.assignment?.chapter?.module?.id || !submission?.assignment?.chapter?.module?.course?.id) {
            return new NextResponse("Invalid assignment structure", { status: 400 });
        }

        let questionTotalPoints = 0;

        // For online assignments with questions
        if (submission.assignment.questions && submission.assignment.questions.length > 0) {
            questionTotalPoints = calculateTotalPoints(submission.assignment.questions);
            if (Math.abs(totalPoints - 100) > 0.01) {
                return new NextResponse("Total points must be 100", { status: 400 });
            }
        } 
        // For document-based assignments
        else {
            // For document submissions, we directly use the teacher's input
            // No need to validate against 100-point scale since there are no individual questions
            questionTotalPoints = totalPoints;
        }

        const actualEarnedPoints = normalizeScore(
            percentage, 
            100, 
            submission.assignment.maxPoints ?? 0
        );

        // Record the grade history regardless of whether it's first grade or regrade
        await prisma.gradeHistory.create({
            data: {
                submissionId: submission.id,
                score: actualEarnedPoints, 
                gradedBy: session.user.id,
                // If admin is doing the grading, auto-approve
                approved: session.user.role === "ADMIN",
                approvedBy: session.user.role === "ADMIN" ? session.user.id : null,
                approvedAt: session.user.role === "ADMIN" ? new Date() : null
            }
        });

        // Update each answer's score for online submissions
        const updateAnswers = Object.entries(scores).map(([answerId, score]) =>
            prisma.answer.update({
                where: { id: answerId },
                data: { score: score }, // Store normalized score (0-100)
            })
        );

        // Update submission and student assignment score
        await prisma.$transaction([
            ...updateAnswers,
            prisma.submission.update({
                where: { id: params.submissionId },
                data: {
                    status: "GRADED",
                    score: actualEarnedPoints,
                    submittedAt: new Date(),
                    lastGradedBy: session.user.id,
                    regradePending: false,
                    regradeReason: null
                },
            }),
            prisma.studentAssignmentScore.upsert({
                where: {
                    studentId_assignmentId: {
                        studentId: submission.student.id,
                        assignmentId: submission.assignment.id,
                    },
                },
                create: {
                    studentId: submission.student.id,
                    assignmentId: submission.assignment.id,
                    score: actualEarnedPoints,
                    maxScore: submission.assignment.maxPoints ?? 0
                },
                update: {
                    score: actualEarnedPoints,
                    maxScore: submission.assignment.maxPoints ?? 0
                },
            }),
        ]);

        // Update module and course scores
        await updateModuleAndCourseScores({
            studentId: submission.student.id,
            moduleId: submission.assignment.chapter.module.id,
            courseId: submission.assignment.chapter.module.course.id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[GRADE_SUBMISSION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}