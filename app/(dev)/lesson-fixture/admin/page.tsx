// Dev-only admin chapter preview fixture for `yarn check:lesson-layout`. Returns 404 in production.
import { notFound } from "next/navigation";
import type { Chapter } from "@prisma/client";
import { devFixtureOnly } from "@/lib/dev-fixture";
import { LESSON_FIXTURES, type LessonFixtureId } from "../fixtures";
import { AdminPreview } from "./admin-preview";

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
  return (
    <main className="dl-app mx-auto w-full max-w-3xl p-4">
      <AdminPreview chapter={chapter} />
    </main>
  );
}
