import "server-only";

import { PERFECT_FINAL_QUIZ_SCORE } from "@/lib/certificate-eligibility";
import { prisma } from "@/lib/db";
import { buildCourseReport, type CourseReport, type ReportScope } from "@/lib/reports/course-report";

const studentWhere = { role: "STUDENT", isDeleted: false } as const;

export async function getCourseReport(scope: ReportScope, now: Date = new Date()): Promise<CourseReport> {
  const courseId = scope.courseId ? { in: [scope.courseId] } : undefined;
  const inCourse = { module: { courseId } };

  const [courses, modules, chapters, quizzes, enrollments, progress, perfectAttempts, certificates, students] =
    await Promise.all([
      prisma.course.findMany({ where: { id: courseId }, select: { id: true, title: true } }),
      prisma.courseModule.findMany({ where: { courseId }, select: { id: true, courseId: true, position: true } }),
      prisma.chapter.findMany({
        where: inCourse,
        select: { id: true, moduleId: true, position: true, isPublished: true, title: true, type: true },
      }),
      prisma.quiz.findMany({
        where: { chapter: inCourse },
        select: { id: true, chapterId: true, title: true, isFinalExam: true },
      }),
      prisma.courseEnrollment.findMany({
        where: { courseId, user: studentWhere },
        select: { userId: true, courseId: true, enrolledAt: true, completedAt: true },
      }),
      prisma.chapterProgress.findMany({
        where: { chapter: inCourse, user: studentWhere },
        select: { userId: true, chapterId: true, isCompleted: true, createdAt: true },
      }),
      prisma.quizAttempt.findMany({
        where: {
          status: "COMPLETED",
          scorePercent: { gte: PERFECT_FINAL_QUIZ_SCORE },
          quiz: { chapter: inCourse },
          user: studentWhere,
        },
        select: { userId: true, quizId: true },
      }),
      prisma.certificate.findMany({
        where: { courseId, user: studentWhere },
        select: { userId: true, courseId: true, issuedAt: true, revokedAt: true },
      }),
      prisma.user.findMany({
        where: studentWhere,
        select: { id: true, ageRange: true, country: true, region: true, onboardingCompleted: true },
      }),
    ]);

  return buildCourseReport(
    { courses, modules, chapters, quizzes, enrollments, progress, perfectAttempts, certificates, students },
    scope,
    now,
  );
}

export async function getReportCourseOptions(): Promise<{ id: string; title: string }[]> {
  return prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
}
