// Dev-only admin chapter preview fixture for `yarn check:lesson-layout`. Returns 404 in production.
import { notFound } from "next/navigation";
import type { Chapter } from "@prisma/client";
import { ChapterContentForm } from "@/app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-content-form";
import { ChapterDescriptionForm } from "@/app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-description-form";
import { devFixtureOnly } from "@/lib/dev-fixture";
import { LESSON_FIXTURES, type LessonFixtureId } from "../fixtures";

export default async function AdminPreviewFixturePage(props: { searchParams: Promise<{ fixture?: string }> }) {
  devFixtureOnly();
  const { fixture = "table-url" } = await props.searchParams;
  const data = LESSON_FIXTURES[fixture as LessonFixtureId];
  if (!data) notFound();
  const chapter = {
    id: "fixture-chapter",
    title: data.title,
    description: data.description,
    richContent: data.richContent,
    videoUrl: null,
    pdfUrl: null,
    youtubeUrl: null,
  } as unknown as Chapter;
  const ids = { courseId: "fixture-course", moduleId: "fixture-module", chapterId: "fixture-chapter" };
  return (
    <main className="dl-app mx-auto w-full max-w-3xl p-4">
      <ChapterDescriptionForm initialData={chapter} {...ids} />
      <ChapterContentForm initialData={chapter} {...ids} />
    </main>
  );
}
