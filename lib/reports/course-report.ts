import type { ChapterType } from "@prisma/client";

import { courseHasAnyQuiz, pickFinalQuiz } from "../certificate-eligibility";
import { AGE_BUCKETS, normalizeOptionalText, toAgeBucket, type AgeBucket } from "../demographics";
import { bucketByMonth, overviewWindow } from "../overview-buckets";
import { UNKNOWN } from "./keys";

export const FUNNEL_STEPS = ["ENROLLED", "STARTED", "COMPLETED", "FINAL_PASSED", "CERTIFIED"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];
export type FinalExamStatus = "RESOLVED" | "NO_QUIZZES" | "UNRESOLVED";
export type BucketKey<T extends string> = T | typeof UNKNOWN;

export type ReportRows = {
  courses: { id: string; title: string }[];
  modules: { id: string; courseId: string; position: number }[];
  chapters: { id: string; moduleId: string; position: number; isPublished: boolean; title: string; type: ChapterType }[];
  quizzes: { id: string; chapterId: string; title: string; isFinalExam: boolean }[];
  enrollments: { userId: string; courseId: string; enrolledAt: Date; completedAt: Date | null }[];
  progress: { userId: string; chapterId: string; isCompleted: boolean; createdAt: Date }[];
  perfectAttempts: { userId: string; quizId: string }[];
  certificates: { userId: string; courseId: string; issuedAt: Date; revokedAt: Date | null }[];
  students: { id: string; ageRange: string | null; country: string | null; region: string | null; onboardingCompleted: boolean }[];
};

export type ReportScope = { courseId: string | null; country: string | null; from: Date | null; toExclusive: Date | null };

export type BreakdownRow<K extends string> = { key: K; students: number; completed: number; certified: number };
export type CourseBreakdownRow = BreakdownRow<string> & { title: string; finalExam: FinalExamStatus };
export type MonthCount = { month: string; count: number };

export type CourseReport = {
  scope: ReportScope;
  courseTitle: string | null;
  totals: { students: number; onboarded: number; withDemographics: number; certificatesIssued: number; peopleCompleted: number };
  funnel: { step: FunnelStep; count: number }[];
  unit: "PEOPLE" | "ENROLLMENTS";
  finalExam: FinalExamStatus | null;
  byAge: BreakdownRow<AgeBucket>[];
  byCountry: BreakdownRow<string>[];
  byRegion: BreakdownRow<string>[] | null;
  byCourse: CourseBreakdownRow[];
  certificatesByMonth: MonthCount[];
};

type Student = ReportRows["students"][number];

type CourseModel = {
  id: string;
  title: string;
  publishedChapterIds: Set<string>;
  finalQuizId: string | null;
  finalExam: FinalExamStatus;
};

type Participation = {
  student: Student;
  course: CourseModel;
  enteredAt: Date;
  reached: Record<FunnelStep, boolean>;
  certificateIssuedAt: Date | null;
};

const monthKey = (monthStart: Date) => monthStart.toISOString().slice(0, 7);

const pairKey = (a: string, b: string) => `${a}\u0000${b}`;

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

function modelCourses(rows: ReportRows): Map<string, CourseModel> {
  const quizByChapter = new Map(rows.quizzes.map((quiz) => [quiz.chapterId, quiz]));
  const chaptersByModule = groupBy(rows.chapters, (chapter) => chapter.moduleId);
  const modulesByCourse = groupBy(rows.modules, (module) => module.courseId);

  return new Map(
    rows.courses.map((course) => {
      const modules = [...(modulesByCourse.get(course.id) ?? [])].sort(byPosition).map((module) =>
        [...(chaptersByModule.get(module.id) ?? [])].sort(byPosition).map((chapter) => ({
          ...chapter,
          quiz: quizByChapter.get(chapter.id) ?? null,
        })),
      );
      const published = modules.map((chapters) => ({ chapters: chapters.filter((chapter) => chapter.isPublished) }));
      const finalQuiz = pickFinalQuiz(published);
      const finalExam: FinalExamStatus = finalQuiz
        ? "RESOLVED"
        : courseHasAnyQuiz(modules.map((chapters) => ({ chapters })))
          ? "UNRESOLVED"
          : "NO_QUIZZES";

      return [
        course.id,
        {
          id: course.id,
          title: course.title,
          publishedChapterIds: new Set(published.flatMap((module) => module.chapters.map((chapter) => chapter.id))),
          finalQuizId: finalQuiz?.id ?? null,
          finalExam,
        },
      ];
    }),
  );
}

type ParticipationDraft = {
  userId: string;
  courseId: string;
  enrolledAt: Date | null;
  enrollmentCompleted: boolean;
  firstProgressAt: Date | null;
  completedPublished: Set<string>;
  certificateIssuedAt: Date | null;
};

function buildParticipations(rows: ReportRows, courses: Map<string, CourseModel>): Participation[] {
  const studentsById = new Map(rows.students.map((student) => [student.id, student]));
  const courseByModule = new Map(rows.modules.map((module) => [module.id, module.courseId]));
  const courseByChapter = new Map(rows.chapters.map((chapter) => [chapter.id, courseByModule.get(chapter.moduleId)]));
  const perfect = new Set(rows.perfectAttempts.map((attempt) => pairKey(attempt.userId, attempt.quizId)));
  const drafts = new Map<string, ParticipationDraft>();

  const draftFor = (userId: string, courseId: string | undefined): ParticipationDraft | null => {
    if (!courseId || !courses.has(courseId) || !studentsById.has(userId)) return null;
    const key = pairKey(userId, courseId);
    let draft = drafts.get(key);
    if (!draft) {
      draft = {
        userId,
        courseId,
        enrolledAt: null,
        enrollmentCompleted: false,
        firstProgressAt: null,
        completedPublished: new Set(),
        certificateIssuedAt: null,
      };
      drafts.set(key, draft);
    }
    return draft;
  };

  for (const enrollment of rows.enrollments) {
    const draft = draftFor(enrollment.userId, enrollment.courseId);
    if (!draft) continue;
    draft.enrolledAt = enrollment.enrolledAt;
    draft.enrollmentCompleted = enrollment.completedAt != null;
  }

  for (const progress of rows.progress) {
    const courseId = courseByChapter.get(progress.chapterId);
    const draft = draftFor(progress.userId, courseId);
    if (!draft || !courseId) continue;
    if (!draft.firstProgressAt || progress.createdAt < draft.firstProgressAt) draft.firstProgressAt = progress.createdAt;
    if (progress.isCompleted && courses.get(courseId)?.publishedChapterIds.has(progress.chapterId)) {
      draft.completedPublished.add(progress.chapterId);
    }
  }

  for (const certificate of rows.certificates) {
    if (certificate.revokedAt) continue;
    const draft = draftFor(certificate.userId, certificate.courseId);
    if (draft) draft.certificateIssuedAt = certificate.issuedAt;
  }

  return [...drafts.values()].map((draft) => {
    const course = courses.get(draft.courseId) as CourseModel;
    const publishedCount = course.publishedChapterIds.size;
    const completed =
      draft.enrollmentCompleted ||
      draft.certificateIssuedAt != null ||
      (publishedCount > 0 && draft.completedPublished.size >= publishedCount);
    const finalPassed =
      course.finalExam === "RESOLVED"
        ? perfect.has(pairKey(draft.userId, course.finalQuizId as string))
        : course.finalExam === "NO_QUIZZES" && completed;

    return {
      student: studentsById.get(draft.userId) as Student,
      course,
      enteredAt: (draft.enrolledAt ?? draft.firstProgressAt ?? draft.certificateIssuedAt) as Date,
      certificateIssuedAt: draft.certificateIssuedAt,
      reached: {
        ENROLLED: true,
        STARTED: draft.firstProgressAt != null,
        COMPLETED: completed,
        FINAL_PASSED: finalPassed,
        CERTIFIED: draft.certificateIssuedAt != null,
      },
    };
  });
}

function inScope(participation: Participation, scope: ReportScope): boolean {
  if (scope.courseId && participation.course.id !== scope.courseId) return false;
  if (scope.country && normalizeOptionalText(participation.student.country) !== scope.country) return false;
  if (scope.from && participation.enteredAt < scope.from) return false;
  if (scope.toExclusive && participation.enteredAt >= scope.toExclusive) return false;
  return true;
}

function funnelDepth(participation: Participation): number {
  const firstMissed = FUNNEL_STEPS.findIndex((step) => !participation.reached[step]);
  return firstMissed === -1 ? FUNNEL_STEPS.length : firstMissed;
}

type PersonTally = { completed: boolean; certified: boolean };

function tallyPeople(participations: Participation[]): Map<Student, PersonTally> {
  const people = new Map<Student, PersonTally>();
  for (const participation of participations) {
    const tally = people.get(participation.student) ?? { completed: false, certified: false };
    tally.completed ||= participation.reached.COMPLETED;
    tally.certified ||= participation.reached.CERTIFIED;
    people.set(participation.student, tally);
  }
  return people;
}

function breakdown(
  people: Map<Student, PersonTally>,
  keyOf: (student: Student) => string,
  seedKeys: readonly string[],
): Map<string, BreakdownRow<string>> {
  const rows = new Map(seedKeys.map((key) => [key, { key, students: 0, completed: 0, certified: 0 }]));
  for (const [student, tally] of people) {
    const key = keyOf(student);
    const row = rows.get(key) ?? { key, students: 0, completed: 0, certified: 0 };
    row.students += 1;
    row.completed += tally.completed ? 1 : 0;
    row.certified += tally.certified ? 1 : 0;
    rows.set(key, row);
  }
  return rows;
}

const compareNames = (a: string, b: string) => a.localeCompare(b, "es");

function sortPlaces(rows: Map<string, BreakdownRow<string>>): BreakdownRow<string>[] {
  const known = [...rows.values()].filter((row) => row.key !== UNKNOWN);
  known.sort((a, b) => b.students - a.students || compareNames(a.key, b.key));
  const unknown = rows.get(UNKNOWN);
  return unknown ? [...known, unknown] : known;
}

const placeKey = (value: string | null) => normalizeOptionalText(value) ?? UNKNOWN;

export function buildCourseReport(rows: ReportRows, scope: ReportScope, now: Date): CourseReport {
  const courses = modelCourses(rows);
  const participations = buildParticipations(rows, courses).filter((participation) => inScope(participation, scope));
  const people = tallyPeople(participations);
  const peopleList = [...people.keys()];

  const depths = participations.map(funnelDepth);
  const funnel = FUNNEL_STEPS.map((step, i) => ({ step, count: depths.filter((depth) => depth > i).length }));

  const ageRows = breakdown(people, (student) => toAgeBucket(student.ageRange), AGE_BUCKETS);
  const byAge = AGE_BUCKETS.map((bucket) => ageRows.get(bucket) as BreakdownRow<AgeBucket>);

  const byCourse: CourseBreakdownRow[] = scope.courseId
    ? []
    : [...courses.values()]
        .map((course) => {
          const own = participations.filter((participation) => participation.course === course);
          return {
            key: course.id,
            title: course.title,
            finalExam: course.finalExam,
            students: own.length,
            completed: own.filter((participation) => participation.reached.COMPLETED).length,
            certified: own.filter((participation) => participation.reached.CERTIFIED).length,
          };
        })
        .sort((a, b) => b.certified - a.certified || compareNames(a.title, b.title));

  const monthCounts = bucketByMonth(
    participations.flatMap((participation) =>
      participation.certificateIssuedAt ? [{ date: participation.certificateIssuedAt, value: 1 }] : [],
    ),
    now,
  );
  const certificatesByMonth = overviewWindow(now).monthStarts.map((start, i) => ({
    month: monthKey(start),
    count: monthCounts[i],
  }));

  const selectedCourse = scope.courseId ? courses.get(scope.courseId) : undefined;

  return {
    scope,
    courseTitle: selectedCourse?.title ?? null,
    totals: {
      students: peopleList.length,
      onboarded: peopleList.filter((student) => student.onboardingCompleted).length,
      withDemographics: peopleList.filter(
        (student) => toAgeBucket(student.ageRange) !== UNKNOWN && normalizeOptionalText(student.country) !== null,
      ).length,
      certificatesIssued: participations.filter((participation) => participation.reached.CERTIFIED).length,
      peopleCompleted: [...people.values()].filter((tally) => tally.completed).length,
    },
    funnel,
    unit: scope.courseId ? "PEOPLE" : "ENROLLMENTS",
    finalExam: selectedCourse?.finalExam ?? null,
    byAge,
    byCountry: sortPlaces(breakdown(people, (student) => placeKey(student.country), [UNKNOWN])),
    byRegion: scope.country ? sortPlaces(breakdown(people, (student) => placeKey(student.region), [])) : null,
    byCourse,
    certificatesByMonth,
  };
}
