import { User, Level, Course, LevelTeacher, LevelCourse } from "@prisma/client"

export type LevelWithRelations = Level & {
    students: User[]
    teacherLevels: (LevelTeacher & { teacher: User })[]
    levelCourses: (LevelCourse & { course: Course })[]
}