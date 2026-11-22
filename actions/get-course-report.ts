import "server-only";

import { PERFECT_FINAL_QUIZ_SCORE } from "@/lib/certificate-eligibility";
import { prisma } from "@/lib/db";
import { buildCourseReport, type CourseReport, type ReportScope } from "@/lib/reports/course-report";
import { toPublicReport, type PublicCourseReport } from "@/lib/reports/publish";
import { parseReportFilters, type FilterIssue, type RawSearchParams } from "@/lib/reports/report-filters";

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

export type LoadedCourseReport = {
  courses: { id: string; title: string }[];
  report: PublicCourseReport;
  issues: FilterIssue[];
};

export async function loadPublicCourseReport(params: RawSearchParams): Promise<LoadedCourseReport> {
  const requested = Array.isArray(params.course) ? params.course[0] : params.course;
  const optimistic = parseReportFilters(params, new Set(requested ? [requested] : []));
  const [courses, optimisticReport] = await Promise.all([getReportCourseOptions(), getCourseReport(optimistic.scope)]);

  const parsed = parseReportFilters(params, new Set(courses.map((course) => course.id)));
  const report =
    parsed.scope.courseId === optimistic.scope.courseId ? optimisticReport : await getCourseReport(parsed.scope);

  return { courses, report: toPublicReport(report, parsed.filters), issues: parsed.issues };
}
