import type { ReportRows } from "./course-report";

const at = (day: string) => new Date(`${day}T15:00:00Z`);

const chapter = (id: string, moduleId: string, position: number, type: "LESSON" | "QUIZ", isPublished = true) => ({
  id,
  moduleId,
  position,
  isPublished,
  title: id,
  type,
});

const student = (id: string, ageRange: string | null, country: string | null, region: string | null) => ({
  id,
  ageRange,
  country,
  region,
  onboardingCompleted: true,
});

const done = (userId: string, chapterIds: string[], day: string) =>
  chapterIds.map((chapterId) => ({ userId, chapterId, isCompleted: true, createdAt: at(day) }));

export const FIXTURE_NOW = new Date("2026-11-17T18:00:00Z");

export const FIXTURE_ROWS: ReportRows = {
  courses: [
    { id: "c1", title: "Bitcoin 101" },
    { id: "c2", title: "Sin quizzes" },
    { id: "c3", title: "Examen oculto" },
  ],
  modules: [
    { id: "m1", courseId: "c1", position: 1 },
    { id: "m2", courseId: "c1", position: 2 },
    { id: "m3", courseId: "c2", position: 1 },
    { id: "m4", courseId: "c3", position: 1 },
  ],
  chapters: [
    chapter("ch1", "m1", 1, "LESSON"),
    chapter("ch2", "m1", 2, "QUIZ"),
    chapter("ch3", "m2", 1, "QUIZ"),
    chapter("ch4", "m3", 1, "LESSON"),
    chapter("ch5", "m3", 2, "LESSON"),
    chapter("ch6", "m4", 1, "LESSON"),
    chapter("ch7", "m4", 2, "QUIZ", false),
  ],
  quizzes: [
    { id: "q1", chapterId: "ch2", title: "q1", isFinalExam: false },
    { id: "q2", chapterId: "ch3", title: "q2", isFinalExam: false },
    { id: "q3", chapterId: "ch7", title: "q3", isFinalExam: false },
  ],
  enrollments: [
    { userId: "u1", courseId: "c1", enrolledAt: at("2026-01-10"), completedAt: at("2026-02-01") },
    { userId: "u2", courseId: "c1", enrolledAt: at("2026-01-15"), completedAt: at("2026-02-10") },
    { userId: "u3", courseId: "c1", enrolledAt: at("2026-03-01"), completedAt: null },
    { userId: "u4", courseId: "c1", enrolledAt: at("2026-03-05"), completedAt: null },
    { userId: "a1", courseId: "c1", enrolledAt: at("2026-01-01"), completedAt: at("2026-01-02") },
    { userId: "u5", courseId: "c2", enrolledAt: at("2026-02-01"), completedAt: at("2026-02-05") },
    { userId: "u1", courseId: "c2", enrolledAt: at("2026-05-01"), completedAt: null },
    { userId: "u2", courseId: "c3", enrolledAt: at("2026-06-01"), completedAt: null },
  ],
  progress: [
    ...done("u1", ["ch1", "ch2", "ch3"], "2026-01-11"),
    ...done("u2", ["ch1", "ch2", "ch3"], "2026-01-16"),
    ...done("u3", ["ch1"], "2026-03-02"),
    ...done("u6", ["ch1", "ch2", "ch3"], "2026-04-01"),
    ...done("u5", ["ch4", "ch5"], "2026-02-02"),
    ...done("a1", ["ch1"], "2026-01-01"),
    ...done("u2", ["ch6"], "2026-06-02"),
  ],
  perfectAttempts: [
    { userId: "u1", quizId: "q2" },
    { userId: "u2", quizId: "q1" },
    { userId: "u6", quizId: "q2" },
    { userId: "u2", quizId: "q3" },
  ],
  certificates: [
    { userId: "u1", courseId: "c1", issuedAt: at("2026-02-02"), revokedAt: null },
    { userId: "u5", courseId: "c2", issuedAt: at("2026-02-06"), revokedAt: null },
  ],
  students: [
    student("u1", "18-24", "Guatemala", "Guatemala"),
    student("u2", "25-34", "Guatemala", "Quetzaltenango"),
    student("u3", "13-17", "El Salvador", "San Salvador"),
    student("u4", null, null, null),
    student("u5", "", "", ""),
    student("u6", "25-34", "Mexico", "Jalisco"),
  ],
};
