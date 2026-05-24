import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                email: session.user?.email!,
            },
        });

        const values = await req.json();
        const { answers, attachments, status } = values;

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: params.assignmentId,
            },
            include: {
                questions: true,
                chapter: true,
            },
        });

        if (!assignment) {
            return new NextResponse("Assignment not found", { status: 404 });
        }

        if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
            return new NextResponse("Assignment deadline has passed", { status: 403 });
        }

        // Check if submission already exists
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                studentId_assignmentId: {
                    assignmentId: params.assignmentId,
                    studentId: dbUser?.id!,
                }
            }
        });

        if (existingSubmission) {
            return new NextResponse("You have already submitted this assignment", { status: 400 });
        }

        const submission = await prisma.$transaction(async (tx) => {

            const sub = await tx.submission.create({
                data: {
                    assignmentId: params.assignmentId,
                    studentId: dbUser?.id!,
                    status: status,
                    submittedAt: new Date(),
                    ...(answers && {
                        answers: {
                            create: answers.map((answer: { questionId: string; content: string }) => ({
                                questionId: answer.questionId,
                                content: answer.content,
                                isCorrect: false,
                            })),
                        },
                    }),
                    ...(attachments && {
                        attachments: {
                            create: attachments.map((url: string) => ({
                                url,
                                name: url.split("/").pop() || "unnamed",
                                uploaderId: dbUser?.id!,
                            })),
                        },
                    }),
                },
            });

            await tx.chapterProgress.upsert({
                where: {
                    userId_chapterId: {
                        userId: dbUser?.id!,
                        chapterId: assignment.chapterId,
                    },
                },
                create: {
                    userId: dbUser?.id!,
                    chapterId: assignment.chapterId,
                    isCompleted: true,
                },
                update: {
                    isCompleted: true,
                },
            });

            return sub;
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("[ASSIGNMENT_SUBMIT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

function checkAnswer(question: any, answer: string): boolean {
    if (question.type !== "MULTIPLE_CHOICE") return false;
    return question.correctOption === answer;
}