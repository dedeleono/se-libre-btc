import { Course, CourseEnrollment, LearningPath, LearningPathCourse, LearningPathEnrollment } from "@prisma/client"

export type LearningPathWithRelations = LearningPath & {
    enrollments: LearningPathEnrollment[]
    courses: (LearningPathCourse & { course: Course })[]
}

export type CourseWithEnrollments = Course & {
    enrollments: CourseEnrollment[]
}