import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteFile } from "@/lib/s3"
import { CourseDeliveryMode, CourseDifficulty } from "@prisma/client"
import * as z from "zod"

const updateCourseSchema = z.object({
    title: z.string().min(1).optional(),
    shortDescription: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    deliveryMode: z.nativeEnum(CourseDeliveryMode).optional(),
    estimatedDuration: z.string().nullable().optional(),
    lessonDuration: z.string().nullable().optional(),
    isFree: z.boolean().optional(),
    price: z.union([z.string(), z.number()]).nullable().optional(),
})

export async function DELETE(req: Request, props: { params: Promise<{ courseId: string }> }) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            include: {
                attachments: true,
                modules: {
                    include: {
                        chapters: {
                            include: {
                                attachments: true,
                            }
                        }
                    }
                },
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

        const deletedCourse = await prisma.course.delete({
            where: { id: params.courseId }
        })

        return NextResponse.json(deletedCourse)

    } catch (error) {
        console.error("Error deleting course:", error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request, props: {params: Promise<{courseId: string}>}) {
    const params = await props.params;
    try {
        
        const session = await auth()

        if(!session?.user) return new NextResponse("Unauthorized", { status: 401 })
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

        const values = updateCourseSchema.parse(await req.json());

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
