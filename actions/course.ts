import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function assignCourseToLearningPath(courseId: string, learningPathId: string) {
    const position = await prisma.learningPathCourse.count({ where: { learningPathId } });

    return prisma.learningPathCourse.upsert({
        where: {
            learningPathId_courseId: {
                learningPathId,
                courseId,
            },
        },
        create: {
            courseId,
            learningPathId,
            position,
        },
        update: {},
    });
}

export async function createCourse(data: { title: string; [key: string]: unknown }) {
    try {
        const baseSlug = typeof data.slug === "string" && data.slug.trim()
            ? withFallbackSlug(data.slug, "course")
            : withFallbackSlug(data.title, "course");
        let slug = baseSlug;
        let suffix = 1;

        while (await prisma.course.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }

        return await prisma.course.create({
            data: {
                ...data,
                slug,
            },
        });
    } catch (error) {
        console.error("Error in createCourse:", error);
        throw new Error("Failed to create course");
    }
}
