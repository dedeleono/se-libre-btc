import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { updateModuleAndCourseScores } from "@/actions/grades";

export async function POST(
    req: Request,
    { params }: { params: { submissionId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { approved, pendingGradeId } = await req.json();

        const submission = await prisma.submission.findUnique({
            where: { id: params.submissionId },
            include: {
                assignment: {
                    include: {
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
                student: true,
            }
        });

        if (!submission || !submission.regradePending) {
            return new NextResponse("No pending regrade found", { status: 404 });
        }

        const pendingGrade = await prisma.gradeHistory.findUnique({
            where: { id: pendingGradeId }
        });

        if (!pendingGrade || pendingGrade.approved) {
            return new NextResponse("Invalid pending grade", { status: 400 });
        }

        if (approved) {
            // Approve the regrade
            await prisma.$transaction([
                // Update the grade history record
                prisma.gradeHistory.update({
                    where: { id: pendingGradeId },
                    data: {
                        approved: true,
                        approvedBy: session.user.id,
                        approvedAt: new Date()
                    }
                }),
                // Update the submission with the new grade
                prisma.submission.update({
                    where: { id: params.submissionId },
                    data: {
                        score: pendingGrade.score,
                        regradePending: false,
                        regradeReason: null
                    }
                }),
                // Update the student assignment score
                prisma.studentAssignmentScore.update({
                    where: {
                        studentId_assignmentId: {
                            studentId: submission.student.id,
                            assignmentId: submission.assignment.id
                        }
                    },
                    data: {
                        score: pendingGrade.score
                    }
                })
            ]);

            // Update module and course scores
            await updateModuleAndCourseScores({
                studentId: submission.student.id,
                moduleId: submission.assignment.chapter.module.id,
                courseId: submission.assignment.chapter.module.course.id
            });

            return NextResponse.json({ success: true, message: "Regrade approved" });
        } else {
            // Reject the regrade
            await prisma.$transaction([
                // Mark the grade history as rejected
                prisma.gradeHistory.update({
                    where: { id: pendingGradeId },
                    data: {
                        approved: false,
                        approvedBy: session.user.id,
                        approvedAt: new Date()
                    }
                }),
                // Clear the pending state on the submission
                prisma.submission.update({
                    where: { id: params.submissionId },
                    data: {
                        regradePending: false,
                        regradeReason: null
                    }
                })
            ]);

            return NextResponse.json({ success: true, message: "Regrade rejected" });
        }
    } catch (error) {
        console.error("[APPROVE_REGRADE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}