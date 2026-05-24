// import { auth } from "@/lib/auth"
// import { prisma } from "@/lib/db"
// import { ChapterType, QuestionType } from "@prisma/client"
// import { NextResponse } from "next/server"

// export async function PATCH(
//     req: Request,
//     { params }: { params: { courseId: string; moduleId: string; chapterId: string } }
// ) {
//     try {
//         const session = await auth()
//         if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

//         const chapter = await prisma.chapter.findUnique({
//             where: {
//                 id: params.chapterId,
//                 moduleId: params.moduleId,
//             },
//             include: {
//                 assignments: {
//                     include: {
//                         questions: {
//                             include: {
//                                 options: true
//                             }
//                         }
//                     }
//                 }
//             }
//         });

//         if (!chapter) {
//             return new NextResponse("Not found", { status: 404 })
//         }

//         let isValid = false;
//         let errorMessage = "";

//         switch (chapter.type) {
//             case ChapterType.LESSON:
//                 isValid = Boolean(
//                     chapter.title &&
//                     chapter.description &&
//                     (chapter.videoUrl || chapter.pdfUrl) &&
//                     !(chapter.videoUrl && chapter.pdfUrl) // Ensure not both
//                 );
//                 errorMessage = `Missing required fields for lesson. Title: ${Boolean(chapter.title)}, Description: ${Boolean(chapter.description)}, Content: ${Boolean(chapter.videoUrl || chapter.pdfUrl)}`;
//                 break;

//             case ChapterType.QUIZ:
//             case ChapterType.ASSIGNMENT:
//                 const assignment = chapter.assignments[0];
//                 if (!assignment) {
//                     isValid = false;
//                     errorMessage = "No assignment found for quiz/assignment chapter";
//                     break;
//                 }

//                 const hasQuestions = assignment.questions.length > 0;
//                 const questionsValid = assignment.questions.every(question => {
//                     if (question.type === QuestionType.MULTIPLE_CHOICE) {
//                         return question.options.length >= 2;
//                     }
//                     return true;
//                 });

//                 isValid = Boolean(
//                     chapter.title &&
//                     assignment.description &&
//                     hasQuestions &&
//                     questionsValid
//                 );

//                 errorMessage = `Missing required fields. Title: ${Boolean(chapter.title)}, Assignment Description: ${Boolean(assignment.description)}, Has Questions: ${hasQuestions}, Questions Valid: ${questionsValid}`;
//                 break;
//         }

//         if (!isValid) {
//             return new NextResponse(errorMessage, { status: 400 });
//         }

//         const publishedChapter = await prisma.chapter.update({
//             where: {
//                 id: params.chapterId,
//                 moduleId: params.moduleId,
//             },
//             data: {
//                 isPublished: true,
//             }
//         });

//         return NextResponse.json(publishedChapter);

//     } catch (error) {
//         console.log("CHAPTER_PUBLISH", error)
//         return new NextResponse("Internal Error", { status: 500 })
//     }
// }


import { validateChapterForPublishing } from "@/lib/validations/chapter";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string; moduleId: string; chapterId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const chapter = await prisma.chapter.findUnique({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
            include: {
                assignments: {
                    include: {
                        questions: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!chapter) {
            return new NextResponse("Not found", { status: 404 });
        }

        const validation = validateChapterForPublishing(chapter);

        if (!validation.isValid) {
            return new NextResponse(validation.message, { status: 400 });
        }

        const publishedChapter = await prisma.chapter.update({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
            data: {
                isPublished: true,
            },
        });

        return NextResponse.json({
            ...publishedChapter,
            message: "Chapter published successfully"
        });

    } catch (error) {
        console.log("CHAPTER_PUBLISH", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}