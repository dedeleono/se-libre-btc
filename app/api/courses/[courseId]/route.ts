import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteFile } from "@/lib/s3"

export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            include: {
                attachments: true,
                courseCategory: true,
                modules: {
                    include: {
                        chapters: {
                            include: {
                                attachments: true,
                                assignments: {
                                    include: {
                                        submissions: true,
                                        questions: {
                                            include: {
                                                options: true,
                                                answers: true
                                            }
                                        },
                                        studentAssignmentScores: true
                                    }
                                }
                            }
                        }
                    }
                },
                studentCourses: true,
                studentScores: true,
                levelCourses: true
            }
        })

        if(!course) return new NextResponse("Not Found", { status: 404 })

        const filesToDelete = [
            ...course.modules.flatMap(module =>
                module.chapters.flatMap(chapter => [
                    chapter.videoUrl,
                    chapter.imageUrl,
                    ...chapter.attachments.map(attachment => attachment.url)
                ])
            ),
            ...course.attachments.map(attachment => attachment.url),
            course.imageUrl
        ].filter(Boolean);

        // Delete files from S3
        for (const fileUrl of filesToDelete) {
            try {
                await deleteFile(fileUrl as string);
                console.log(`File deleted from S3: ${fileUrl}`);
            } catch (error) {
                console.error(`Error deleting file from S3: ${fileUrl}`, error);
            }
        }

        const deletedCourse = await prisma.$transaction([
            // Delete student scores
            prisma.studentCourseScore.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Delete student courses
            prisma.studentCourse.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Delete level courses
            prisma.levelCourse.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Delete answers and question options
            prisma.answer.deleteMany({
                where: {
                    question: {
                        assignment: {
                            chapter: {
                                module: {
                                    courseId: params.courseId
                                }
                            }
                        }
                    }
                }
            }),
            prisma.questionOption.deleteMany({
                where: {
                    question: {
                        assignment: {
                            chapter: {
                                module: {
                                    courseId: params.courseId
                                }
                            }
                        }
                    }
                }
            }),
            // Delete questions
            prisma.question.deleteMany({
                where: {
                    assignment: {
                        chapter: {
                            module: {
                                courseId: params.courseId
                            }
                        }
                    }
                }
            }),
            // Delete submissions and scores
            prisma.submission.deleteMany({
                where: {
                    assignment: {
                        chapter: {
                            module: {
                                courseId: params.courseId
                            }
                        }
                    }
                }
            }),
            prisma.studentAssignmentScore.deleteMany({
                where: {
                    assignment: {
                        chapter: {
                            module: {
                                courseId: params.courseId
                            }
                        }
                    }
                }
            }),
            // Delete assignments
            prisma.assignment.deleteMany({
                where: {
                    chapter: {
                        module: {
                            courseId: params.courseId
                        }
                    }
                }
            }),
            // Delete course categories
            prisma.courseCategory.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Delete attachments
            prisma.attachment.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Delete course modules and chapters
            prisma.courseModule.deleteMany({
                where: { courseId: params.courseId }
            }),
            // Finally delete the course
            prisma.course.delete({
                where: { id: params.courseId }
            })
        ])

        return NextResponse.json(deletedCourse)

    } catch (error) {
        console.error("Error deleting course:", error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    {params}: {params: {courseId: string}}
) {
    try {
        
        const session = await auth()

        const values = await req.json();

        if(!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const currentCourse = await prisma.course.findUnique({
            where: {
                id: params.courseId,
            },
            select: {
                imageUrl: true,
            }
        })

        if (!currentCourse) return new NextResponse("Course not found", { status: 404 });

        // Check if a new image is being uploaded
        if (values.imageUrl && values.imageUrl !== currentCourse.imageUrl) {
            // Delete the old image from S3
            if (currentCourse.imageUrl) {
                try {
                    await deleteFile(currentCourse.imageUrl);
                } catch (error) {
                    console.error("Error deleting old image from S3:", error);
                }
            }
        }

        const course = await prisma.course.update({
            where: { id: params.courseId },
            data: { ...values }
        })

        return NextResponse.json(course)

    } catch (error) {
        console.log("error fetching ")
        return new NextResponse("Internal Error", {status: 500})
    }
}